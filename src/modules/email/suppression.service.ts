import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SuppressionService {
  constructor(private readonly prisma: PrismaService) {}

  async suppress(emails: string[], reason: string) {
    if (!emails.length) return;
    await this.prisma.suppressionEntry.createMany({
      data: emails.map((email) => ({ email, reason })),
      skipDuplicates: true,
    });
  }

  async isSuppressed(email: string): Promise<boolean> {
    const entry = await this.prisma.suppressionEntry.findUnique({ where: { email } });
    return !!entry;
  }

  async filterSuppressed(emails: string[]): Promise<string[]> {
    if (!emails.length) return [];
    const entries = await this.prisma.suppressionEntry.findMany({
      where: { email: { in: emails } },
      select: { email: true },
    });
    const suppressed = new Set(entries.map((e) => e.email));
    return emails.filter((e) => !suppressed.has(e));
  }
}