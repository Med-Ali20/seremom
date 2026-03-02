// chat.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Res,
  Patch,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/send-message.dto';
import { UpdateConversationDto } from './dto/update-conversation.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Throttle, SkipThrottle } from '@nestjs/throttler';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('conversations')
  createConversation(@Req() req: any) {
    return this.chatService.createConversation(req.user.userId);
  }

  @Get('conversations')
  @SkipThrottle()
  getUserConversations(@Req() req: any) {
    return this.chatService.getUserConversations(req.user.userId);
  }

  @Get('conversations/:conversationId')
  getConversation(
    @Param('conversationId') conversationId: string,
    @Req() req: any,
  ) {
    return this.chatService.getConversation(conversationId, req.user.userId);
  }

  @Post('conversations/:conversationId/messages')
  @Throttle({ short: { ttl: 60000, limit: 20 } })
  async sendMessage(
    @Param('conversationId') conversationId: string,
    @Req() req: any,
    @Body() sendMessageDto: SendMessageDto,
    @Res() res: Response,
  ) {
    await this.chatService.sendMessage(
      conversationId,
      req.user.userId,
      sendMessageDto,
      res,
    );
  }

  @Patch('conversations/:conversationId')
  updateConversation(
    @Param('conversationId') conversationId: string,
    @Req() req: any,
    @Body() updateConversationDto: UpdateConversationDto,
  ) {
    return this.chatService.updateConversation(
      conversationId,
      req.user.userId,
      updateConversationDto,
    );
  }

  @Delete('conversations/:conversationId')
  deleteConversation(
    @Param('conversationId') conversationId: string,
    @Req() req: any,
  ) {
    return this.chatService.deleteConversation(conversationId, req.user.userId);
  }

  @Get('messages/count')
  @SkipThrottle()
  getUserMessageCount(@Req() req: any) {
    const since = new Date(Date.now() - 4 * 60 * 60 * 1000);
    return this.chatService
      .getUserMessageCount(req.user.userId, since)
      .then((count) => ({
        count,
        remaining: Math.max(0, 15 - count),
        limit: 15,
        resetsAt: since.getTime() + 4 * 60 * 60 * 1000, // when the oldest msg in window ages out
      }));
  }
}
