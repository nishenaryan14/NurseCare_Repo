import { Controller, Post, Get, Patch, Param, Body, UseGuards, Req } from '@nestjs/common';
import { VideoCallsService } from './video-calls.service';
import { JwtAuthGuard } from '../common/guards/jwt.guard';

@Controller('video-calls')
@UseGuards(JwtAuthGuard)
export class VideoCallsController {
  constructor(private videoCallsService: VideoCallsService) {}

  // Start a new video call
  @Post('start')
  async startCall(
    @Body() body: { conversationId: number },
    @Req() req: any,
  ) {
    return this.videoCallsService.startCall(body.conversationId, req.user.userId);
  }

  // End a video call
  @Patch(':id/end')
  async endCall(@Param('id') callId: string) {
    return this.videoCallsService.endCall(parseInt(callId));
  }

  // Get call by room name
  @Get('room/:roomName')
  async getCallByRoomName(@Param('roomName') roomName: string) {
    return this.videoCallsService.getCallByRoomName(roomName);
  }

  // Get call history for a conversation
  @Get('conversation/:id/history')
  async getCallHistory(@Param('id') conversationId: string) {
    return this.videoCallsService.getCallHistory(parseInt(conversationId));
  }

  // Get ongoing call for a conversation
  @Get('conversation/:id/ongoing')
  async getOngoingCall(@Param('id') conversationId: string) {
    return this.videoCallsService.getOngoingCall(parseInt(conversationId));
  }
}
