import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { UpdateConversationDto } from './dto/update-conversation.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('conversations')
  createConversation(@Body() createConversationDto: CreateConversationDto) {
    return this.chatService.createConversation(createConversationDto);
  }

  @Get('conversations/user/:userId')
  getUserConversations(@Param('userId') userId: string) {
    return this.chatService.getUserConversations(userId);
  }

  @Get('conversations/:conversationId/user/:userId')
  getConversation(
    @Param('conversationId') conversationId: string,
    @Param('userId') userId: string,
  ) {
    return this.chatService.getConversation(conversationId, userId);
  }

  @Post('conversations/:conversationId/messages/user/:userId')
  sendMessage(
    @Param('conversationId') conversationId: string,
    @Param('userId') userId: string,
    @Body() sendMessageDto: SendMessageDto,
  ) {
    return this.chatService.sendMessage(conversationId, userId, sendMessageDto);
  }

  @Patch('conversations/:conversationId/user/:userId')
  updateConversation(
    @Param('conversationId') conversationId: string,
    @Param('userId') userId: string,
    @Body() updateConversationDto: UpdateConversationDto,
  ) {
    return this.chatService.updateConversation(
      conversationId,
      userId,
      updateConversationDto,
    );
  }

  @Delete('conversations/:conversationId/user/:userId')
  deleteConversation(
    @Param('conversationId') conversationId: string,
    @Param('userId') userId: string,
  ) {
    return this.chatService.deleteConversation(conversationId, userId);
  }
}
