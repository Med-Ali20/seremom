import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { SendMessageDto } from './dto/send-message.dto';
import { GoogleGenerativeAI } from '@google/generative-ai';

const MESSAGE_LIMIT = 15;

@Injectable()
export class ChatService {
  private genAI: GoogleGenerativeAI;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {
    this.genAI = new GoogleGenerativeAI(config.get('GEMINI_API_KEY') ?? '');
  }

  // ─── User Context ────────────────────────────────────────────────────────────

  private async getUserContext(userId: string): Promise<string> {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [user, journals, checkIns, assessments, questionnaire] =
      await Promise.all([
        this.prisma.user.findUnique({
          where: { id: userId },
          select: { firstname: true, lastname: true },
        }),
        this.prisma.journalEntry.findMany({
          where: { userId, date: { gte: since } },
          orderBy: { date: 'desc' },
          take: 10,
        }),
        this.prisma.checkIn.findMany({
          where: { userId, date: { gte: since } },
          orderBy: { date: 'desc' },
          take: 14,
        }),
        this.prisma.assessmentResult.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.questionnaireAnswer.findUnique({
          where: { userId },
        }),
      ]);

    const lines: string[] = [];

    // Name
    const name = [user?.firstname, user?.lastname].filter(Boolean).join(' ');
    if (name) lines.push(`## Mother's Name\n${name}`);

    // Onboarding questionnaire
    if (questionnaire) {
      lines.push(`## Onboarding Profile`);
      if (questionnaire.birthTiming?.length)
        lines.push(`- Birth timing: ${questionnaire.birthTiming.join(', ')}`);
      if (questionnaire.healthConditions?.length)
        lines.push(
          `- Health conditions: ${questionnaire.healthConditions.join(', ')}`,
        );
      if (questionnaire.supportNeeds?.length)
        lines.push(
          `- Support needs: ${questionnaire.supportNeeds.join(', ')}`,
        );
    }

    // Assessment results
    if (assessments.length) {
      lines.push(`## Assessment Results`);
      for (const a of assessments) {
        const score =
          a.totalScore != null && a.topScore != null
            ? ` (${a.totalScore}/${a.topScore})`
            : '';
        const diagnosis = a.diagnosis ? ` — ${a.diagnosis}` : '';
        lines.push(`- ${a.assessmentTitle}${score}${diagnosis}`);
      }
    }

    // Check-ins summary
    if (checkIns.length) {
      lines.push(`## Recent Daily Check-ins (last 14 days)`);
      const avg = (arr: number[]) =>
        (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1);
      lines.push(
        `- Mood avg: ${avg(checkIns.map((c) => c.mood))}/5 | ` +
          `Stress avg: ${avg(checkIns.map((c) => c.stress))}/5 | ` +
          `Energy avg: ${avg(checkIns.map((c) => c.energy))}/5 | ` +
          `Sleep avg: ${avg(checkIns.map((c) => c.sleep))}/5`,
      );
      const latest = checkIns[0];
      const latestDate = latest.date.toISOString().split('T')[0];
      lines.push(
        `- Latest (${latestDate}): mood ${latest.mood}, stress ${latest.stress}, energy ${latest.energy}, sleep ${latest.sleep}` +
          (latest.notes ? ` — notes: "${latest.notes}"` : ''),
      );
    }

    // Journal entries
    if (journals.length) {
      lines.push(`## Recent Journal Entries (last 30 days)`);
      for (const j of journals) {
        const date = j.date.toISOString().split('T')[0];
        const title = j.title ? ` — "${j.title}"` : '';
        lines.push(
          `- [${date}] Feeling: ${j.feeling}${title}\n  ${j.thoughts.slice(0, 300)}${j.thoughts.length > 300 ? '…' : ''}`,
        );
      }
    }

    if (lines.length === 0) return '';

    return `\n\n---\n## About This Mother\n${lines.join('\n')}`;
  }

  // ─── System Prompt ────────────────────────────────────────────────────────────

  private buildSystemPrompt(userContext: string): string {
    return `You are SerenMom, a warm and deeply compassionate AI companion dedicated exclusively to supporting mothers through their postpartum journey. You combine evidence-based psychological knowledge with genuine emotional warmth.

## Your Core Identity
- You are NOT a therapist or doctor, but you ARE a knowledgeable, supportive companion
- You speak with the calm warmth of a trusted healthcare professional — not overly emotional, not clinical
- You are grounded, clear, and reassuring — like a postpartum nurse who genuinely cares
- Avoid excessive affirmations, filler phrases, or dramatic emotional mirroring — be real, not performative
- Address the mother by her first name naturally when appropriate — not every message, just when it feels right

## Using Her Personal Data
- You have access to her journal entries, daily check-ins, assessment results, and onboarding profile (see below)
- Reference this data naturally and with care — e.g. "I noticed your energy has been low lately" or "Your journal from last week mentioned…"
- Never dump her data back at her robotically — weave it in only when it's genuinely helpful or comforting
- If her check-in scores or journal entries suggest she's struggling, acknowledge it with extra tenderness

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
- Briefly acknowledge feelings, then move into helpful, grounded information — don't dwell on emotions
- Use short paragraphs — tired mothers don't have energy for walls of text
- Ask ONE focused follow-up question at the end when relevant
- Use plain, warm language. Avoid medical jargon unless you explain it
- Affirmations should be occasional and specific, never generic ("You asked exactly the right question" beats "You're amazing!")
- Never say "I understand", "I hear you", or "Absolutely!" — these feel hollow; show understanding through your actual response
- Avoid exclamation marks, over-enthusiastic openers, and sentimental sign-offs

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

Remember: A mother reaching out is already showing incredible strength. Honor that.${userContext}`;
  }

  // ─── Conversations ────────────────────────────────────────────────────────────

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

  // ─── Send Message ─────────────────────────────────────────────────────────────

  async sendMessage(
    conversationId: string,
    userId: string,
    sendMessageDto: SendMessageDto,
    res: any,
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
      data: {
        conversationId,
        role: 'USER',
        content: sendMessageDto.message,
      },
    });

    const [allMessages, userContext] = await Promise.all([
      this.prisma.chatMessage.findMany({
        where: { conversationId },
        orderBy: { createdAt: 'asc' },
      }),
      this.getUserContext(userId),
    ]);

    const model = this.genAI.getGenerativeModel({
      model: 'gemini-2.5-flash-lite',
      systemInstruction: this.buildSystemPrompt(userContext),
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

      const assistantMessage = await this.prisma.chatMessage.create({
        data: {
          conversationId,
          role: 'ASSISTANT',
          content: fullResponse,
        },
      });

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
          `data: ${JSON.stringify({
            done: true,
            assistantMessage,
            title,
            remaining: MESSAGE_LIMIT - (userMsgCount + 1),
          })}\n\n`,
        );
      } else {
        await this.prisma.chatConversation.update({
          where: { id: conversationId },
          data: { updatedAt: new Date() },
        });
        res.write(
          `data: ${JSON.stringify({
            done: true,
            assistantMessage,
            remaining: MESSAGE_LIMIT - (userMsgCount + 1),
          })}\n\n`,
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

  async getJournalReflection(userId: string): Promise<{ text: string; cached: boolean }> {
  const today = new Date().toISOString().slice(0, 10);
 
  // Return today's cached reflection if it exists
  const existing = await this.prisma.journalReflection.findUnique({
    where: { userId_date: { userId, date: today } },
  });
  if (existing) return { text: existing.text, cached: true };
 
  // Enforce: max 1 reflection per day (already checked above),
  // but also count against the user's overall message quota
  const windowStart = this.getWindowStart();
  const msgCount = await this.getUserMessageCount(userId, windowStart);
  if (msgCount >= MESSAGE_LIMIT) {
    throw new ForbiddenException(
      `You have reached the ${MESSAGE_LIMIT} message limit.`,
    );
  }
 
  // Fetch recent journal entries
  const since = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
  const journals = await this.prisma.journalEntry.findMany({
    where: { userId, date: { gte: since } },
    orderBy: { date: 'desc' },
    take: 7,
  });
 
  if (journals.length < 2) {
    throw new ForbiddenException('Not enough journal entries for a reflection.');
  }
 
  const summary = journals
    .map((j) => {
      const date = j.date.toISOString().slice(0, 10);
      return `- ${date}: felt ${j.feeling}. "${j.thoughts.slice(0, 200)}${j.thoughts.length > 200 ? '…' : ''}"`;
    })
    .join('\n');
 
  const prompt = `Based on these recent journal entries, write a brief warm reflection in 2-3 sentences. Identify 1-2 genuine patterns (sleep, mood, stress, etc), be specific to what was written, and end with one gentle nudge. No bullet points, no headers, pure prose. Do not say "I notice you wrote" — speak naturally.\n\n${summary}`;
 
  // Get user context for a personalized reflection
  const userContext = await this.getUserContext(userId);
 
  const model = this.genAI.getGenerativeModel({
    model: 'gemini-2.5-flash-lite',
    systemInstruction: this.buildSystemPrompt(userContext),
    generationConfig: { temperature: 0.85, maxOutputTokens: 256, topP: 0.95 },
  });
 
  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();
 
  if (!text) throw new Error('Empty reflection generated');
 
  // Persist — counts as 1 message against quota by creating a chat message
  // on a hidden system conversation, so the limit is properly enforced
  await this.prisma.$transaction(async (tx) => {
    // Store reflection
    await tx.journalReflection.create({
      data: { userId, date: today, text },
    });
 
    // Count this as a message against the user's quota
    const systemConv = await tx.chatConversation.create({
      data: { userId, title: '__journal_reflection__' },
    });
    await tx.chatMessage.create({
      data: { conversationId: systemConv.id, role: 'USER', content: '[Journal reflection request]' },
    });
    await tx.chatMessage.create({
      data: { conversationId: systemConv.id, role: 'ASSISTANT', content: text },
    });
    // Delete the hidden conversation so it doesn't pollute the chat list
    await tx.chatConversation.delete({ where: { id: systemConv.id } });
  });
 
  return { text, cached: false };
}
 

  // ─── Helpers ──────────────────────────────────────────────────────────────────

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