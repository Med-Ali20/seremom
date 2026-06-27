import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface SubscribeInput {
  email: string;
  firstName?: string;
}

@Injectable()
export class SubscribersService {
  constructor(private readonly prisma: PrismaService) {}

  async subscribe({ email, firstName }: SubscribeInput) {
    const existing = await this.prisma.subscriber.findUnique({ where: { email } });

    if (existing) {
      if (existing.status === 'ACTIVE') return existing; // idempotent re-signup

      // Re-subscribing after unsubscribe/bounce/complaint: reactivate status,
      // but DON'T touch SuppressionEntry here — that list still blocks sends
      // and should only be cleared manually. See README.
      return this.prisma.subscriber.update({
        where: { id: existing.id },
        data: { status: 'ACTIVE' },
      });
    }

    return this.prisma.subscriber.create({ data: { email, firstName } });
  }

  list() {
    return this.prisma.subscriber.findMany({ orderBy: { createdAt: 'desc' } });
  }

  findByEmail(email: string) {
    return this.prisma.subscriber.findUnique({ where: { email } });
  }

  updateSegments(id: string, segments: string[]) {
    return this.prisma.subscriber.update({ where: { id }, data: { segments } });
  }

  stats() {
    return this.prisma.subscriber.groupBy({
      by: ['status'],
      _count: true,
    });
  }
}