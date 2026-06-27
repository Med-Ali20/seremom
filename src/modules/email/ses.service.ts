import { Injectable } from '@nestjs/common';
import { SESv2Client, SendEmailCommand } from '@aws-sdk/client-sesv2';

const ses = new SESv2Client({ region: process.env.AWS_REGION });

interface SendArgs {
  to: string;
  subject: string;
  html: string;
  text?: string;
  fromName: string;
  replyTo?: string;
  campaignId?: string;
  subscriberId?: string;
  headers?: { name: string; value: string }[];
}

@Injectable()
export class SesService {
  async send({
    to,
    subject,
    html,
    text,
    fromName,
    replyTo,
    campaignId,
    subscriberId,
    headers,
  }: SendArgs): Promise<string> {
    const fromEmail = process.env.SES_FROM_EMAIL!;

    const res = await ses.send(
      new SendEmailCommand({
        FromEmailAddress: `${fromName} <${fromEmail}>`,
        Destination: { ToAddresses: [to] },
        ReplyToAddresses: replyTo ? [replyTo] : undefined,
        ConfigurationSetName: process.env.SES_CONFIGURATION_SET,
        Content: {
          Simple: {
            Subject: { Data: subject, Charset: 'UTF-8' },
            Body: {
              Html: { Data: html, Charset: 'UTF-8' },
              ...(text ? { Text: { Data: text, Charset: 'UTF-8' } } : {}),
            },
            Headers: headers?.map((h) => ({ Name: h.name, Value: h.value })),
          },
        },
        // Tags let us correlate SNS bounce/complaint events back to a
        // subscriber even if messageId lookup ever fails.
        EmailTags: [
          ...(campaignId ? [{ Name: 'campaignId', Value: campaignId }] : []),
          ...(subscriberId ? [{ Name: 'subscriberId', Value: subscriberId }] : []),
        ],
      }),
    );

    if (!res.MessageId) throw new Error('SES did not return a MessageId');
    return res.MessageId;
  }
}