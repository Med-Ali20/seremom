import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OpenAI } from 'openai';
import { ConfigService } from '@nestjs/config';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { SendMessageDto } from './dto/send-message.dto';

@Injectable()
export class ChatService {
  private openai: OpenAI;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {
    this.openai = new OpenAI({
      apiKey: config.get('OPENAI_API_KEY'),
    });
  }

  private readonly SYSTEM_PROMPT = `You are a compassionate and knowledgeable AI assistant specializing in postpartum support. 
Your role is to provide emotional support, practical advice, and evidence-based information to mothers during their postpartum journey.

Key guidelines:
- Be empathetic, warm, and non-judgmental
- Provide evidence-based information about postpartum recovery, mental health, and baby care
- Recognize signs of postpartum depression or anxiety and gently encourage professional help when needed
- Never provide medical diagnoses - always recommend consulting healthcare providers for medical concerns
- Offer practical tips for self-care, sleep, feeding, and managing postpartum challenges
- Validate their feelings and experiences
- Be supportive and encouraging

Remember: You're here to support, not replace, professional medical or mental health care.`;

  async createConversation(createConversationDto: CreateConversationDto) {
    return await this.prisma.chatConversation.create({
      data: {
        userId: createConversationDto.userId,
        title: createConversationDto.title || 'New Conversation',
      },
      include: {
        messages: true,
      },
    });
  }

  async getUserConversations(userId: string) {
    return await this.prisma.chatConversation.findMany({
      where: { userId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          take: 1,
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async getConversation(conversationId: string, userId: string) {
    const conversation = await this.prisma.chatConversation.findFirst({
      where: {
        id: conversationId,
        userId,
      },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    return conversation;
  }

  async sendMessage(
    conversationId: string,
    userId: string,
    sendMessageDto: SendMessageDto,
  ) {
    // Verify conversation belongs to user
    const conversation = await this.getConversation(conversationId, userId);

    // Save user message
    const userMessage = await this.prisma.chatMessage.create({
      data: {
        conversationId,
        role: 'USER',
        content: sendMessageDto.message,
      },
    });

    // Get conversation history
    const messages = await this.prisma.chatMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
    });

    // Prepare messages for OpenAI
    const openAIMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: 'system', content: this.SYSTEM_PROMPT },
      ...messages.map((msg) => ({
        role: msg.role.toLowerCase() as 'user' | 'assistant' | 'system',
        content: msg.content,
      })),
    ];

    try {
      // Get AI response
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo', 
        messages: openAIMessages,
        temperature: 0.7,
        max_tokens: 800,
      });

      const assistantResponse = completion.choices[0]?.message?.content;

      // Handle null or undefined response
      if (!assistantResponse) {
        throw new BadRequestException('Failed to get response from AI');
      }

      // Save assistant message
      const assistantMessage = await this.prisma.chatMessage.create({
        data: {
          conversationId,
          role: 'ASSISTANT',
          content: assistantResponse,
        },
      });

      // Update conversation timestamp and auto-generate title if first message
      if (messages.length === 1 && (!conversation.title || conversation.title === 'New Conversation')) {
        const title = await this.generateConversationTitle(sendMessageDto.message);
        await this.prisma.chatConversation.update({
          where: { id: conversationId },
          data: { 
            title,
            updatedAt: new Date(),
          },
        });
      } else {
        await this.prisma.chatConversation.update({
          where: { id: conversationId },
          data: { updatedAt: new Date() },
        });
      }

      return {
        userMessage,
        assistantMessage,
      };
    } catch (error) {
      // If OpenAI fails, still update conversation but return error info
      await this.prisma.chatConversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
      });

      throw new BadRequestException(
        error instanceof Error ? error.message : 'Failed to generate AI response',
      );
    }
  }

  private async generateConversationTitle(firstMessage: string): Promise<string> {
    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'Generate a short, 3-5 word title for this conversation. Only return the title, nothing else.',
          },
          {
            role: 'user',
            content: firstMessage,
          },
        ],
        max_tokens: 20,
      });

      const title = completion.choices[0]?.message?.content;
      
      return title 
        ? title.replace(/['"]/g, '').trim()
        : 'New Conversation';
    } catch (error) {
      return 'New Conversation';
    }
  }

  async deleteConversation(conversationId: string, userId: string) {
    const conversation = await this.prisma.chatConversation.findFirst({
      where: {
        id: conversationId,
        userId,
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    await this.prisma.chatConversation.delete({
      where: { id: conversationId },
    });

    return { message: 'Conversation deleted successfully' };
  }

  async updateConversation(
    conversationId: string,
    userId: string,
    updateData: { title?: string },
  ) {
    await this.getConversation(conversationId, userId);

    return await this.prisma.chatConversation.update({
      where: { id: conversationId },
      data: updateData,
    });
  }
}