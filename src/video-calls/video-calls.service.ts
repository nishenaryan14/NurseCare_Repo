import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { randomBytes } from 'crypto';

@Injectable()
export class VideoCallsService {
  constructor(private prisma: PrismaService) {}

  // Create system message for video call
  private async createCallMessage(
    conversationId: number,
    callerId: number,
    content: string,
  ) {
    return this.prisma.message.create({
      data: {
        conversationId,
        senderId: callerId,
        content,
        type: 'SYSTEM',
        read: true,
      },
      include: {
        sender: {
          select: { id: true, name: true, role: true },
        },
      },
    });
  }

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

    // Create system message for call start
    await this.createCallMessage(
      conversationId,
      userId,
      'VIDEO_CALL_STARTED',
    );

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

    // Format duration for display
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    const durationText = minutes > 0 
      ? `${minutes}m ${seconds}s` 
      : `${seconds}s`;

    // Create system message for call end
    await this.createCallMessage(
      call.conversationId,
      call.startedBy,
      `VIDEO_CALL_ENDED:${durationText}`,
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

  // Mark call as missed
  async markCallAsMissed(callId: number) {
    const call = await this.prisma.videoCall.findUnique({
      where: { id: callId },
    });

    if (!call) {
      throw new Error('Call not found');
    }

    // Create system message for missed call
    await this.createCallMessage(
      call.conversationId,
      call.startedBy,
      'VIDEO_CALL_MISSED',
    );

    return this.prisma.videoCall.update({
      where: { id: callId },
      data: {
        status: 'MISSED',
        endedAt: new Date(),
      },
    });
  }

  // Accept call (join existing call)
  async acceptCall(roomName: string, userId: number) {
    const call = await this.prisma.videoCall.findUnique({
      where: { roomName },
    });

    if (!call) {
      throw new Error('Call not found');
    }

    // Create system message for call accepted
    await this.createCallMessage(
      call.conversationId,
      userId,
      'VIDEO_CALL_JOINED',
    );

    return {
      ...call,
      jitsiUrl: `https://meet.jit.si/${roomName}`,
    };
  }
}
