import {
  BadRequestException,
  Controller,
  HttpCode,
  Logger,
  Post,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import MessageValidator from 'sns-validator';
import axios from 'axios';
import { PrismaService } from '../prisma/prisma.service';
import { SuppressionService } from './suppression.service';
import { SnsEnvelope, SesNotification } from './sns.types';

const validator = new MessageValidator();

// IMPORTANT: this route must receive the raw text body, not JSON-parsed.
// SNS sends Content-Type: text/plain. Register a text parser for this
// path only — see main.ts. Do not put express.json() in front of it.
// Also: read the body via @Req(), not @Body() — global pipes (e.g. a
// sanitize pipe) can mutate string bodies and break SNS signature checks.
@Controller('webhooks/ses-sns')
export class SnsController {
  private readonly logger = new Logger(SnsController.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly suppression: SuppressionService,
  ) {}

  @Post()
  @HttpCode(200)
  async handle(@Req() req: Request) {
    console.log('Headers:', req.headers);
    console.log('Body:', req.body);
    const rawBody = req.body as string;
    let envelope: SnsEnvelope;

    try {
      envelope = JSON.parse(rawBody);
    } catch {
      throw new BadRequestException('Invalid JSON body');
    }

    await this.verifySignature(envelope);

    if (envelope.Type === 'SubscriptionConfirmation') {
      await axios.get(envelope.SubscribeURL!);
      this.logger.log('Confirmed SNS topic subscription');
      return { ok: true };
    }

    if (envelope.Type !== 'Notification') {
      return { ok: true };
    }

    console.log('SNS Type:', envelope.Type);
    console.log('SNS Message:', envelope.Message);

    const notification: SesNotification = JSON.parse(envelope.Message);
    await this.processNotification(notification);
    return { ok: true };
  }

  private verifySignature(envelope: SnsEnvelope): Promise<void> {
    return new Promise((resolve, reject) => {
      validator.validate(
        envelope as unknown as Record<string, unknown>,
        (err: Error | null) => {
          if (err) {
            this.logger.warn(
              `SNS signature verification failed: ${err.message}`,
            );
            return reject(new BadRequestException('Invalid SNS signature'));
          }
          resolve();
        },
      );
    });
  }

  private async processNotification(notification: SesNotification) {
    const messageId = notification.mail.messageId;

    switch (notification.notificationType) {
      case 'Bounce': {
        const emails = notification.bounce.bouncedRecipients.map(
          (r) => r.emailAddress,
        );
        await this.recordEvent(messageId, emails, 'BOUNCE', notification);
        if (notification.bounce.bounceType === 'Permanent') {
          await this.suppression.suppress(emails, 'bounce');
        }
        break;
      }
      case 'Complaint': {
        const emails = notification.complaint.complainedRecipients.map(
          (r) => r.emailAddress,
        );
        await this.recordEvent(messageId, emails, 'COMPLAINT', notification);
        await this.suppression.suppress(emails, 'complaint');
        break;
      }
      case 'Delivery': {
        await this.recordEvent(
          messageId,
          notification.delivery.recipients,
          'DELIVERY',
          notification,
        );
        break;
      }
    }
  }

  private async recordEvent(
    messageId: string,
    emails: string[],
    type: 'BOUNCE' | 'COMPLAINT' | 'DELIVERY',
    rawPayload: unknown,
  ) {
    if (!emails.length) return;

    const subscribers = await this.prisma.subscriber.findMany({
      where: { email: { in: emails } },
    });

    const statusUpdate =
      type === 'BOUNCE'
        ? 'BOUNCED'
        : type === 'COMPLAINT'
          ? 'COMPLAINED'
          : undefined;

    await this.prisma.$transaction([
      ...subscribers.map((s) =>
        this.prisma.emailEvent.create({
          data: {
            messageId,
            type,
            subscriberId: s.id,
            rawPayload: rawPayload as any,
          },
        }),
      ),
      ...(statusUpdate
        ? [
            this.prisma.subscriber.updateMany({
              where: { email: { in: emails } },
              data: { status: statusUpdate },
            }),
          ]
        : []),
    ]);
  }
}
