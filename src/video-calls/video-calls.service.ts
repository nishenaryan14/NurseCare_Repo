import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { randomBytes } from 'crypto';

@Injectable()
export class VideoCallsService {
  constructor(private prisma: PrismaService) {}

  // Generate a unique room name for Jitsi
  generateRoomName(conversationId: number): string {
    const randomId = randomBytes(8).toString('hex');
    return `nursecare-${conversationId}-${randomId}`;
  }

  // Start a video call
  async startCall(conversationId: number, userId: number) {
    const roomName = this.generateRoomName(conversationId);

    const videoCall = await this.prisma.videoCall.create({
      data: {
        conversationId,
        roomName,
        startedBy: userId,
        status: 'ONGOING',
      },
    });

    return {
      ...videoCall,
      jitsiUrl: `https://meet.jit.si/${roomName}`,
    };
  }

  // End a video call
  async endCall(callId: number) {
    const call = await this.prisma.videoCall.findUnique({
      where: { id: callId },
    });

    if (!call) {
      throw new Error('Call not found');
    }

    const duration = Math.floor(
      (new Date().getTime() - new Date(call.startedAt).getTime()) / 1000,
    );

    return this.prisma.videoCall.update({
      where: { id: callId },
      data: {
        status: 'ENDED',
        endedAt: new Date(),
        duration,
      },
    });
  }

  // Get call by room name
  async getCallByRoomName(roomName: string) {
    return this.prisma.videoCall.findUnique({
      where: { roomName },
      include: {
        conversation: {
          include: {
            participants: {
              include: {
                user: {
                  select: { id: true, name: true, email: true, role: true },
                },
              },
            },
          },
        },
      },
    });
  }

  // Get call history for a conversation
  async getCallHistory(conversationId: number) {
    return this.prisma.videoCall.findMany({
      where: { conversationId },
      orderBy: { startedAt: 'desc' },
    });
  }

  // Get ongoing call for a conversation
  async getOngoingCall(conversationId: number) {
    return this.prisma.videoCall.findFirst({
      where: {
        conversationId,
        status: 'ONGOING',
      },
    });
  }
}
