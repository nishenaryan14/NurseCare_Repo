import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MessagingService {
  constructor(private prisma: PrismaService) {}

  // Create or get conversation between two users
  async getOrCreateConversation(userId1: number, userId2: number, bookingId?: number) {
    // Check if conversation already exists
    const existingConversation = await this.prisma.conversation.findFirst({
      where: {
        AND: [
          { participants: { some: { userId: userId1 } } },
          { participants: { some: { userId: userId2 } } },
        ],
      },
      include: {
        participants: {
          include: {
            user: {
              select: { id: true, name: true, email: true, role: true },
            },
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 50,
          include: {
            sender: {
              select: { id: true, name: true, role: true },
            },
          },
        },
      },
    });

    if (existingConversation) {
      return existingConversation;
    }

    // Create new conversation
    const newConversation = await this.prisma.conversation.create({
      data: {
        bookingId,
        participants: {
          create: [
            { userId: userId1 },
            { userId: userId2 },
          ],
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: { id: true, name: true, email: true, role: true },
            },
          },
        },
        messages: true,
      },
    });

    return newConversation;
  }

  // Get all conversations for a user
  async getUserConversations(userId: number) {
    const conversations = await this.prisma.conversation.findMany({
      where: {
        participants: {
          some: { userId },
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: { id: true, name: true, email: true, role: true },
            },
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 50, // Get more messages for unread count calculation
          include: {
            sender: {
              select: { id: true, name: true, role: true },
            },
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    // Add unread count to each conversation
    return conversations.map(conv => ({
      ...conv,
      unreadCount: conv.messages.filter(msg => !msg.read && msg.senderId !== userId).length,
    }));
  }

  // Send a message
  async sendMessage(conversationId: number, senderId: number, content: string, type: string = 'TEXT') {
    const message = await this.prisma.message.create({
      data: {
        conversationId,
        senderId,
        content,
        type: type as any,
      },
      include: {
        sender: {
          select: { id: true, name: true, role: true },
        },
      },
    });

    // Update conversation's updatedAt
    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    return message;
  }

  // Get messages for a conversation
  async getMessages(conversationId: number, limit: number = 50, offset: number = 0) {
    return this.prisma.message.findMany({
      where: { conversationId },
      include: {
        sender: {
          select: { id: true, name: true, role: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });
  }

  // Mark messages as read
  async markAsRead(conversationId: number, userId: number): Promise<number> {
    const result = await this.prisma.message.updateMany({
      where: {
        conversationId,
        senderId: { not: userId },
        read: false,
      },
      data: {
        read: true,
      },
    });
    
    return result.count; // Return number of messages marked as read
  }

  // Get unread message count
  async getUnreadCount(userId: number) {
    const conversations = await this.prisma.conversation.findMany({
      where: {
        participants: {
          some: { userId },
        },
      },
      select: { id: true },
    });

    const conversationIds = conversations.map(c => c.id);

    return this.prisma.message.count({
      where: {
        conversationId: { in: conversationIds },
        senderId: { not: userId },
        read: false,
      },
    });
  }
}
