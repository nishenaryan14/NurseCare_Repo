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

@WebSocketGateway({
  cors: {
    origin: '*', // Update this with your frontend URL in production
    credentials: true,
  },
})
export class MessagingGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private userSockets: Map<number, string> = new Map(); // userId -> socketId

  constructor(private messagingService: MessagingService) {}

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    // Remove user from online users
    for (const [userId, socketId] of this.userSockets.entries()) {
      if (socketId === client.id) {
        this.userSockets.delete(userId);
        break;
      }
    }
  }

  @SubscribeMessage('register')
  handleRegister(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userId: number },
  ) {
    this.userSockets.set(data.userId, client.id);
    console.log(`User ${data.userId} registered with socket ${client.id}`);
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
      // Save message to database
      const message = await this.messagingService.sendMessage(
        data.conversationId,
        data.senderId,
        data.content,
        data.type || 'TEXT',
      );

      // Get conversation participants
      const conversation = await this.messagingService['prisma'].conversation.findUnique({
        where: { id: data.conversationId },
        include: {
          participants: true,
        },
      });

      // Emit message to all participants
      conversation?.participants.forEach((participant) => {
        const socketId = this.userSockets.get(participant.userId);
        if (socketId) {
          this.server.to(socketId).emit('newMessage', message);
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
    
    // Mark messages as read
    await this.messagingService.markAsRead(data.conversationId, data.userId);
    
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
  handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: number; userId: number; isTyping: boolean },
  ) {
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
}
