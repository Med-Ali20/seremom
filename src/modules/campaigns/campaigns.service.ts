import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { SuppressionService } from '../email/suppression.service';

const BATCH_SIZE = 50; // matches SES sending-rate-friendly batching

function segmentWhere(segment: string) {
  switch (segment) {
    case 'new':
      return { createdAt: { gte: new Date(Date.now() - 30 * 86400_000) } };
    case 'webinar':
      return { segments: { has: 'webinar' } };
    default:
      return {};
  }
}

interface DraftInput {
  subject: string;
  fromName: string;
  replyTo?: string;
  segment: string;
  body: string;
}

@Injectable()
export class CampaignsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly suppression: SuppressionService,
    @InjectQueue('campaign-send') private readonly queue: Queue,
  ) {}

  createDraft(data: DraftInput) {
    return this.prisma.campaign.create({ data: { ...data, status: 'DRAFT' } });
  }

  async sendTest(campaignId: string, email: string) {
    await this.prisma.campaign.findUniqueOrThrow({ where: { id: campaignId } });
    await this.queue.add('send-one', { campaignId, to: email, isTest: true });
  }

  async queueCampaign(campaignId: string) {
    console.log('queueCampaign called:', campaignId);
    const campaign = await this.prisma.campaign.findUniqueOrThrow({
      where: { id: campaignId },
    });
    if (campaign.status !== 'DRAFT') {
      throw new BadRequestException('Campaign already queued or sent');
    }

    const subscribers = await this.prisma.subscriber.findMany({
      where: { status: 'ACTIVE', ...segmentWhere(campaign.segment) },
    });
    const sendableEmails = new Set(
      await this.suppression.filterSuppressed(subscribers.map((s) => s.email)),
    );
    const sendable = subscribers.filter((s) => sendableEmails.has(s.email));
    console.log('Sendable:', sendable.length);

    await this.prisma.campaign.update({
      where: { id: campaign.id },
      data: { status: 'QUEUED', recipientCount: sendable.length },
    });

    for (let i = 0; i < sendable.length; i += BATCH_SIZE) {
      const batch = sendable.slice(i, i + BATCH_SIZE);
      await this.queue.add(
        'send-batch',
        { campaignId: campaign.id, subscriberIds: batch.map((s) => s.id) },
        { delay: Math.floor(i / BATCH_SIZE) * 1000 }, // stagger ~1s/batch
      );
    }

    return { recipientCount: sendable.length };
  }
}
