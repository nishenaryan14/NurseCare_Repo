import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { MessagingService } from '../messaging.service';
import { UseGuards } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@WebSocketGateway({
  cors: {
    origin: '*', // Update this with your frontend URL in production
    credentials: true,
  },
})
export class MessagingGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private userSockets: Map<number, Set<string>> = new Map(); // userId -> Set of socketIds (multiple devices)

  constructor(
    private messagingService: MessagingService,
    private prisma: PrismaService,
  ) {}

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  async handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    
    // Find and remove user from online users
    for (const [userId, socketIds] of this.userSockets.entries()) {
      if (socketIds.has(client.id)) {
        socketIds.delete(client.id);
        
        // If user has no more active connections, mark as offline
        if (socketIds.size === 0) {
          this.userSockets.delete(userId);
          
          // Update database
          await this.prisma.user.update({
            where: { id: userId },
            data: { 
              isOnline: false,
              lastSeen: new Date(),
            },
          });
          
          // Broadcast offline status
          await this.broadcastUserStatus(userId, false);
        }
        break;
      }
    }
  }

  @SubscribeMessage('register')
  async handleRegister(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userId: number },
  ) {
    // Add socket to user's connections
    if (!this.userSockets.has(data.userId)) {
      this.userSockets.set(data.userId, new Set());
    }
    this.userSockets.get(data.userId).add(client.id);
    
    console.log(`User ${data.userId} registered with socket ${client.id}`);
    
    // Update user status in database
    await this.prisma.user.update({
      where: { id: data.userId },
      data: { 
        isOnline: true,
        lastSeen: new Date(),
        lastActivity: new Date(),
      },
    });
    
    // Broadcast online status to relevant users
    await this.broadcastUserStatus(data.userId, true);
    
    return { event: 'registered', data: { userId: data.userId } };
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: {
      conversationId: number;
      senderId: number;
      content: string;
      type?: string;
    },
  ) {
    try {
      // Update sender's last activity
      await this.prisma.user.update({
        where: { id: data.senderId },
        data: { lastActivity: new Date() },
      });
      
      // Save message to database
      const message = await this.messagingService.sendMessage(
        data.conversationId,
        data.senderId,
        data.content,
        data.type || 'TEXT',
      );

      // Get conversation participants
      const conversation = await this.prisma.conversation.findUnique({
        where: { id: data.conversationId },
        include: {
          participants: true,
        },
      });

      // Emit message to all participants
      conversation?.participants.forEach((participant) => {
        const socketIds = this.userSockets.get(participant.userId);
        if (socketIds) {
          socketIds.forEach(socketId => {
            this.server.to(socketId).emit('newMessage', message);
          });
        }
      });

      return { event: 'messageSent', data: message };
    } catch (error) {
      console.error('Error sending message:', error);
      return { event: 'error', data: { message: 'Failed to send message' } };
    }
  }

  @SubscribeMessage('joinConversation')
  async handleJoinConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: number; userId: number },
  ) {
    client.join(`conversation_${data.conversationId}`);
    
    // Update user activity
    await this.prisma.user.update({
      where: { id: data.userId },
      data: { lastActivity: new Date() },
    });
    
    // Mark messages as read
    const updatedCount = await this.messagingService.markAsRead(
      data.conversationId, 
      data.userId
    );
    
    // Notify other participants that messages were read
    if (updatedCount > 0) {
      client.to(`conversation_${data.conversationId}`).emit('messagesRead', {
        conversationId: data.conversationId,
        readBy: data.userId,
        timestamp: new Date(),
      });
    }
    
    return {
      event: 'joinedConversation',
      data: { conversationId: data.conversationId },
    };
  }

  @SubscribeMessage('leaveConversation')
  handleLeaveConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: number },
  ) {
    client.leave(`conversation_${data.conversationId}`);
    return {
      event: 'leftConversation',
      data: { conversationId: data.conversationId },
    };
  }

  @SubscribeMessage('typing')
  async handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: number; userId: number; isTyping: boolean },
  ) {
    // Update user activity
    await this.prisma.user.update({
      where: { id: data.userId },
      data: { lastActivity: new Date() },
    });
    
    // Broadcast typing status to conversation room
    client.to(`conversation_${data.conversationId}`).emit('userTyping', {
      userId: data.userId,
      isTyping: data.isTyping,
    });
  }

  @SubscribeMessage('startVideoCall')
  handleStartVideoCall(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: number; roomName: string; userId: number },
  ) {
    // Notify other participants about video call
    client.to(`conversation_${data.conversationId}`).emit('incomingVideoCall', {
      roomName: data.roomName,
      callerId: data.userId,
    });
    
    return { event: 'videoCallStarted', data: { roomName: data.roomName } };
  }

  @SubscribeMessage('getOnlineStatus')
  async handleGetOnlineStatus(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userIds: number[] },
  ) {
    const statuses = await Promise.all(
      data.userIds.map(async (userId) => {
        const user = await this.prisma.user.findUnique({
          where: { id: userId },
          select: { id: true, isOnline: true, lastSeen: true },
        });
        return user;
      })
    );
    
    // Emit directly to the client
    client.emit('onlineStatuses', statuses);
    
    return { event: 'onlineStatuses', data: statuses };
  }

  // Helper method to broadcast user status changes
  private async broadcastUserStatus(userId: number, isOnline: boolean) {
    try {
      // Get all conversations this user is part of
      const conversations = await this.prisma.conversationParticipant.findMany({
        where: { userId },
        include: {
          conversation: {
            include: {
              participants: true,
            },
          },
        },
      });
      
      // Get user's last seen
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { lastSeen: true },
      });
      
      // Notify all other participants in those conversations
      conversations.forEach(convParticipant => {
        convParticipant.conversation.participants.forEach(participant => {
          if (participant.userId !== userId) {
            const socketIds = this.userSockets.get(participant.userId);
            if (socketIds) {
              socketIds.forEach(socketId => {
                this.server.to(socketId).emit('userStatusChanged', {
                  userId,
                  isOnline,
                  lastSeen: user?.lastSeen || new Date(),
                });
              });
            }
          }
        });
      });
    } catch (error) {
      console.error('Error broadcasting user status:', error);
    }
  }

  // Heartbeat to update activity
  @SubscribeMessage('heartbeat')
  async handleHeartbeat(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userId: number },
  ) {
    await this.prisma.user.update({
      where: { id: data.userId },
      data: { lastActivity: new Date() },
    });
    
    return { event: 'heartbeatAck' };
  }
}
