import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateJournalEntryDto } from './dto/create-journal.dto';
import { UpdateJournalEntryDto } from './dto/update-journal.dto';
import { sanitizeSearch } from '../../common/utils/sanitize-search';

@Injectable()
export class JournalService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, createDto: CreateJournalEntryDto) {
    return this.prisma.journalEntry.create({
      data: {
        ...createDto,
        date: new Date(createDto.date),
        userId, // Automatically link to authenticated user
      },
    });
  }

  async findAll(userId: string) {
    // ONLY return entries belonging to this user
    return this.prisma.journalEntry.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
    });
  }

  async findOne(id: string, userId: string) {
    const entry = await this.prisma.journalEntry.findUnique({
      where: { id },
    });

    if (!entry) {
      throw new NotFoundException('Journal entry not found');
    }

    // SECURITY CHECK: Verify ownership
    if (entry.userId !== userId) {
      throw new ForbiddenException(
        'You can only access your own journal entries',
      );
    }

    return entry;
  }

  async findByDateRange(userId: string, startDate: Date, endDate: Date) {
    return this.prisma.journalEntry.findMany({
      where: {
        userId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { date: 'desc' },
    });
  }

  async searchByFeeling(userId: string, feeling: string) {
    const VALID_FEELINGS = ['depressed', 'sad', 'neutral', 'happy', 'great'];

    // feeling is an enum — validate against whitelist instead of free-text search
    if (!VALID_FEELINGS.includes(feeling?.toLowerCase())) {
      return []; // return empty instead of throwing — no info leakage
    }

    return this.prisma.journalEntry.findMany({
      where: { userId, feeling: feeling.toLowerCase() },
      orderBy: { date: 'desc' },
    });
  }

  async update(id: string, userId: string, updateDto: UpdateJournalEntryDto) {
    // First verify ownership (throws error if not owned by user)
    await this.findOne(id, userId);

    return this.prisma.journalEntry.update({
      where: { id },
      data: {
        ...updateDto,
        ...(updateDto.date && { date: new Date(updateDto.date) }),
      },
    });
  }

  async remove(id: string, userId: string) {
    // First verify ownership
    await this.findOne(id, userId);

    return this.prisma.journalEntry.delete({
      where: { id },
    });
  }
}
