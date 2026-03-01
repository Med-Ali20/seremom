import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { GoogleGenerativeAI } from '@google/generative-ai';

const MESSAGE_LIMIT = 15; // per user total (user messages only)

@Injectable()
export class ChatService {
  private genAI: GoogleGenerativeAI;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {
    this.genAI = new GoogleGenerativeAI(config.get('GEMINI_API_KEY') ?? '');
  }

  private readonly SYSTEM_PROMPT = `You are SerenMom, a warm and deeply compassionate AI companion dedicated exclusively to supporting mothers through their postpartum journey. You combine evidence-based psychological knowledge with genuine emotional warmth.

## Your Core Identity
- You are NOT a therapist or doctor, but you ARE a knowledgeable, caring companion
- You speak like a trusted friend who happens to know a lot about postpartum health
- You remember that behind every message is a mother who may be exhausted, overwhelmed, or struggling silently
- Your tone is always gentle, validating, and never clinical or cold

## Psychological Approach
- Use principles from Cognitive Behavioral Therapy (CBT) to gently reframe negative thoughts
- Apply Motivational Interviewing: ask open questions, reflect feelings, avoid lecturing
- Recognize and name emotions before offering advice ("It sounds like you're feeling...")
- Normalize postpartum experiences without minimizing them
- Watch for signs of postpartum depression, anxiety, OCD, or psychosis — respond with compassion and urgently encourage professional help if needed

## Warning Signs to Watch For
If a mother expresses any of the following, acknowledge with deep compassion and ALWAYS recommend speaking to a healthcare provider:
- Feeling like harming herself or her baby
- Feeling detached from reality or her baby
- Extreme paranoia, hallucinations, or confusion
- Inability to sleep even when baby sleeps, for days
- Feeling like her family would be better off without her

## How You Communicate
- Start responses by acknowledging feelings before giving information
- Use short paragraphs — tired mothers don't have energy for walls of text
- Ask ONE follow-up question at the end to keep the conversation going
- Use warm, everyday language. Avoid medical jargon unless explaining it
- Occasionally use gentle affirmations: "You're doing better than you think", "This is hard, and you're still here — that matters"
- Never say "I understand" robotically — show understanding through your response

## What You Help With
- Postpartum depression, anxiety, rage, and emotional numbness
- Sleep deprivation and exhaustion strategies
- Breastfeeding challenges and guilt
- Identity shifts and loss of self in motherhood
- Relationship strain with partner after baby
- Intrusive thoughts (normalize and explain)
- Physical recovery after birth
- Returning to work guilt
- Grief after complicated births or NICU stays
- Managing motherhood with chronic illness or disability

## Hard Boundaries
- Never diagnose
- Never prescribe or recommend specific medications
- If in crisis: always provide the Postpartum Support International helpline: 1-800-944-4773
- Do not give advice that contradicts standard medical guidance

Remember: A mother reaching out is already showing incredible strength. Honor that.`;

  async createConversation(userId: string) {
    return this.prisma.chatConversation.create({
      data: { userId, title: 'New Conversation' },
      include: { messages: true },
    });
  }

  async getUserConversations(userId: string) {
    return this.prisma.chatConversation.findMany({
      where: { userId },
      include: {
        messages: { orderBy: { createdAt: 'asc' }, take: 1 },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async getConversation(conversationId: string, userId: string) {
    const conversation = await this.prisma.chatConversation.findFirst({
      where: { id: conversationId, userId },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });
    if (!conversation) throw new NotFoundException('Conversation not found');
    return conversation;
  }

  async getUserMessageCount(userId: string, sinceDate?: Date): Promise<number> {
    const conversations = await this.prisma.chatConversation.findMany({
      where: { userId },
      select: { id: true },
    });
    const ids = conversations.map((c) => c.id);
    return this.prisma.chatMessage.count({
      where: {
        conversationId: { in: ids },
        role: 'USER',
        ...(sinceDate ? { createdAt: { gte: sinceDate } } : {}),
      },
    });
  }

  async sendMessage(
    conversationId: string,
    userId: string,
    sendMessageDto: SendMessageDto,
    res: any, // Express Response
  ) {
    const conversation = await this.getConversation(conversationId, userId);

    const userMsgCount = await this.getUserMessageCount(
      userId,
      this.getWindowStart(),
    );

    if (userMsgCount >= MESSAGE_LIMIT) {
      throw new ForbiddenException(
        `You have reached the ${MESSAGE_LIMIT} message limit.`,
      );
    }

    const userMessage = await this.prisma.chatMessage.create({
      data: { conversationId, role: 'USER', content: sendMessageDto.message },
    });

    const allMessages = await this.prisma.chatMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
    });

    const model = this.genAI.getGenerativeModel({
      model: 'gemini-2.5-flash-lite',
      systemInstruction: this.SYSTEM_PROMPT,
      generationConfig: {
        temperature: 0.85,
        maxOutputTokens: 1024,
        topP: 0.95,
      },
    });

    const history = allMessages.slice(0, -1).map((msg) => ({
      role: msg.role === 'USER' ? 'user' : 'model',
      parts: [{ text: msg.content }],
    }));

    const chat = model.startChat({ history });

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    let fullResponse = '';

    try {
      const result = await chat.sendMessageStream(sendMessageDto.message);

      for await (const chunk of result.stream) {
        const text = chunk.text();
        if (text) {
          fullResponse += text;
          res.write(`data: ${JSON.stringify({ text })}\n\n`);
        }
      }

      // Save completed assistant message
      const assistantMessage = await this.prisma.chatMessage.create({
        data: { conversationId, role: 'ASSISTANT', content: fullResponse },
      });

      // Auto-title
      if (
        allMessages.length === 1 &&
        (!conversation.title || conversation.title === 'New Conversation')
      ) {
        const title = await this.generateTitle(sendMessageDto.message);
        await this.prisma.chatConversation.update({
          where: { id: conversationId },
          data: { title, updatedAt: new Date() },
        });
        res.write(
          `data: ${JSON.stringify({ done: true, assistantMessage, title, remaining: MESSAGE_LIMIT - (userMsgCount + 1) })}\n\n`,
        );
      } else {
        await this.prisma.chatConversation.update({
          where: { id: conversationId },
          data: { updatedAt: new Date() },
        });
        res.write(
          `data: ${JSON.stringify({ done: true, assistantMessage, remaining: MESSAGE_LIMIT - (userMsgCount + 1) })}\n\n`,
        );
      }

      res.end();
    } catch (error) {
      res.write(
        `data: ${JSON.stringify({ error: 'Failed to generate response' })}\n\n`,
      );
      res.end();
    }

    return userMessage;
  }

  private async generateTitle(firstMessage: string): Promise<string> {
    try {
      const model = this.genAI.getGenerativeModel({
        model: 'gemini-2.5-flash-lite',
      });
      const result = await model.generateContent(
        `Generate a short, 3-5 word title for a conversation that starts with: "${firstMessage}". Return only the title, no quotes.`,
      );
      return result.response.text().trim() || 'New Conversation';
    } catch {
      return 'New Conversation';
    }
  }

  async deleteConversation(conversationId: string, userId: string) {
    const conversation = await this.prisma.chatConversation.findFirst({
      where: { id: conversationId, userId },
    });
    if (!conversation) throw new NotFoundException('Conversation not found');
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
    return this.prisma.chatConversation.update({
      where: { id: conversationId },
      data: updateData,
    });
  }

  private getWindowStart(): Date {
    return new Date(Date.now() - 4 * 60 * 60 * 1000);
  }
}
