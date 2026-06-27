import {
  Controller,
  Get,
  HttpCode,
  NotFoundException,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { SuppressionService } from './suppression.service';

@Controller('unsubscribe')
export class UnsubscribeController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly suppression: SuppressionService,
  ) {}

  // Browser click from the footer link in the email body
  @Get()
  @Throttle({ default: { ttl: 60000, limit: 20 } })
  async unsubscribe(@Query('token') token: string, @Res() res: Response) {
    const subscriber = await this.unsubscribeByToken(token);
    if (!subscriber) throw new NotFoundException();
    res.redirect(302, `${process.env.FRONTEND_URL}/unsubscribed`);
  }

  // RFC 8058 one-click: Gmail/Yahoo POST here directly, no browser involved.
  // Must return 200 with no redirect/body for the mailbox provider to count it.
  @Post()
  @HttpCode(200)
  @Throttle({ default: { ttl: 60000, limit: 20 } })
  async unsubscribeOneClick(@Query('token') token: string) {
    const subscriber = await this.unsubscribeByToken(token);
    if (!subscriber) throw new NotFoundException();
    return;
  }

  private async unsubscribeByToken(token: string) {
    if (!token) return null;
    const subscriber = await this.prisma.subscriber.findUnique({
      where: { unsubToken: token },
    });
    if (!subscriber) return null;

    await this.prisma.subscriber.update({
      where: { id: subscriber.id },
      data: { status: 'UNSUBSCRIBED' },
    });
    await this.suppression.suppress([subscriber.email], 'manual');
    return subscriber;
  }
}