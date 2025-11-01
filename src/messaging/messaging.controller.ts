import { Controller, Get, Post, Body, Param, UseGuards, Req, Query } from '@nestjs/common';
import { MessagingService } from './messaging.service';
import { JwtAuthGuard } from '../common/guards/jwt.guard';

@Controller('messaging')
@UseGuards(JwtAuthGuard)
export class MessagingController {
  constructor(private messagingService: MessagingService) {}

  // Get or create a conversation
  @Post('conversations')
  async createConversation(
    @Body() body: { otherUserId: number; bookingId?: number },
    @Req() req: any,
  ) {
    return this.messagingService.getOrCreateConversation(
      req.user.userId,
      body.otherUserId,
      body.bookingId,
    );
  }

  // Get all conversations for the current user
  @Get('conversations')
  async getConversations(@Req() req: any) {
    return this.messagingService.getUserConversations(req.user.userId);
  }

  // Get messages for a conversation
  @Get('conversations/:id/messages')
  async getMessages(
    @Param('id') conversationId: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.messagingService.getMessages(
      parseInt(conversationId),
      limit ? parseInt(limit) : 50,
      offset ? parseInt(offset) : 0,
    );
  }

  // Mark messages as read
  @Post('conversations/:id/read')
  async markAsRead(@Param('id') conversationId: string, @Req() req: any) {
    return this.messagingService.markAsRead(
      parseInt(conversationId),
      req.user.userId,
    );
  }

  // Get unread message count
  @Get('unread-count')
  async getUnreadCount(@Req() req: any) {
    const count = await this.messagingService.getUnreadCount(req.user.userId);
    return { count };
  }
}
