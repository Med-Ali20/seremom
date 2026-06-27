import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SesService } from '../email/ses.service';
import { renderEmailShell } from './email-template';

// marked is ESM-only as of v12 — a static import gets transpiled to
// require() in this CommonJS project and throws ERR_REQUIRE_ESM.
// Dynamic import + cache works in both CJS and ESM and only loads once.
let markedPromise: Promise<any> | null = null;
function getMarked() {
  if (!markedPromise) markedPromise = import('marked');
  return markedPromise;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

interface SubLike {
  firstName?: string | null;
  unsubToken: string;
}

@Processor('campaign-send', { concurrency: 5 })
export class CampaignsProcessor extends WorkerHost {
  private readonly logger = new Logger(CampaignsProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly ses: SesService,
  ) {
    super();
  }

  async process(job: Job): Promise<void> {
    if (job.name === 'send-batch') {
      return this.sendBatch(job.data.campaignId, job.data.subscriberIds);
    }
    if (job.name === 'send-one') {
      return this.sendOne(job.data.campaignId, job.data.to);
    }
  }

  private async sendBatch(campaignId: string, subscriberIds: string[]) {
    const campaign = await this.prisma.campaign.findUniqueOrThrow({
      where: { id: campaignId },
    });
    const subscribers = await this.prisma.subscriber.findMany({
      where: { id: { in: subscriberIds } },
    });

    let sentInBatch = 0;
    for (const sub of subscribers) {
      try {
        const html = await this.renderEmail(campaign.subject, campaign.body, sub);
        const unsubscribeUrl = `${process.env.APP_URL}/unsubscribe?token=${sub.unsubToken}`;
        const messageId = await this.ses.send({
          to: sub.email,
          subject: campaign.subject,
          html,
          fromName: campaign.fromName,
          replyTo: campaign.replyTo ?? undefined,
          campaignId: campaign.id,
          subscriberId: sub.id,
          headers: [
            { name: 'List-Unsubscribe', value: `<${unsubscribeUrl}>` },
            { name: 'List-Unsubscribe-Post', value: 'List-Unsubscribe=One-Click' },
          ],
        });
        await this.prisma.emailEvent.create({
          data: { campaignId, subscriberId: sub.id, messageId, type: 'SEND' },
        });
        sentInBatch++;
      } catch (err: any) {
        const isSandboxRejection =
          err?.name === 'MessageRejected' && err?.message?.includes('is not verified');

        if (isSandboxRejection) {
          // Account-level restriction, not an address problem — don't
          // suppress, this address will work fine once SES is out of
          // sandbox (or once it's individually verified for testing).
          this.logger.warn(
            `SES sandbox rejected ${sub.email} — verify the address in SES console or request production access`,
          );
        } else {
          this.logger.error(`Send failed for ${sub.email}: ${err}`);
        }

        // Record every rejection regardless of cause, so it's visible in
        // EmailEvent instead of only in logs, and queueCampaign's filter
        // (or a future cleanup job) has something to query against.
        await this.prisma.emailEvent.create({
          data: {
            campaignId,
            subscriberId: sub.id,
            type: 'REJECT',
            rawPayload: { message: String(err?.message ?? err), sandbox: isSandboxRejection },
          },
        });
      }
    }

    const updated = await this.prisma.campaign.update({
      where: { id: campaignId },
      data: { sentCount: { increment: sentInBatch } },
    });

    if (updated.sentCount >= updated.recipientCount) {
      await this.prisma.campaign.update({
        where: { id: campaignId },
        data: { status: 'SENT', sentAt: new Date() },
      });
    }
  }

  private async sendOne(campaignId: string, to: string) {
    const campaign = await this.prisma.campaign.findUniqueOrThrow({
      where: { id: campaignId },
    });
    const html = await this.renderEmail(campaign.subject, campaign.body, {
      firstName: 'there',
      unsubToken: 'test',
    });
    await this.ses.send({
      to,
      subject: `[TEST] ${campaign.subject}`,
      html,
      fromName: campaign.fromName,
      replyTo: campaign.replyTo ?? undefined,
    });
  }

  // Markdown body -> HTML, with {{first_name}} resolved before conversion
  // (so it works whether or not it's inside **bold** etc) and the
  // unsubscribe token resolved after (it's a raw URL, not markdown).
  private async renderEmail(subject: string, body: string, sub: SubLike) {
    const { marked } = await getMarked();
    const withFirstName = body.replaceAll(
      '{{first_name}}',
      escapeHtml(sub.firstName || 'there'),
    );
    const contentHtml = marked.parse(withFirstName, { async: false }) as string;
    const unsubscribeUrl = `${process.env.APP_URL}/unsubscribe?token=${sub.unsubToken}`;
    const finalHtml = renderEmailShell({
      subject,
      contentHtml,
      unsubscribeUrl,
    });
    // {{unsubscribe_url}} may also appear inline in the composer body itself
    // (e.g. a manual footer line) — resolve it post-conversion just in case.
    return finalHtml.replaceAll('{{unsubscribe_url}}', unsubscribeUrl);
  }
}