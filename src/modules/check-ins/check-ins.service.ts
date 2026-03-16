import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCheckInDto } from './dto/create-check-in.dto';
import { UpdateCheckInDto } from './dto/update-check-in.dto';

@Injectable()
export class CheckInsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateCheckInDto) {
    const date = new Date(dto.date);
    date.setHours(0, 0, 0, 0);

    return this.prisma.checkIn.upsert({
      where: {
        userId_date_slot: {
          userId,
          date,
          slot: dto.slot,
        },
      },
      update: {
        stress: dto.stress,
        mood: dto.mood,
        energy: dto.energy,
        sleep: dto.sleep,
        notes: dto.notes,
      },
      create: {
        stress: dto.stress,
        mood: dto.mood,
        energy: dto.energy,
        sleep: dto.sleep,
        notes: dto.notes,
        date,
        slot: dto.slot,
        userId,
      },
    });
  }

  async findAll(userId: string) {
    return this.prisma.checkIn.findMany({
      where: { userId },
      orderBy: [{ date: 'desc' }, { slot: 'asc' }],
    });
  }

  async findOne(id: string, userId: string) {
    const checkIn = await this.prisma.checkIn.findUnique({ where: { id } });

    if (!checkIn) throw new NotFoundException('Check-in not found');
    if (checkIn.userId !== userId)
      throw new ForbiddenException('You can only access your own check-ins');

    return checkIn;
  }

  async findByDateRange(userId: string, startDate: Date, endDate: Date) {
    return this.prisma.checkIn.findMany({
      where: {
        userId,
        date: { gte: startDate, lte: endDate },
      },
      orderBy: [{ date: 'desc' }, { slot: 'asc' }],
    });
  }

  async update(id: string, userId: string, updateCheckInDto: UpdateCheckInDto) {
    await this.findOne(id, userId);
    return this.prisma.checkIn.update({
      where: { id },
      data: updateCheckInDto,
    });
  }

  async remove(id: string, userId: string) {
    await this.findOne(id, userId);
    return this.prisma.checkIn.delete({ where: { id } });
  }

  async getStats(userId: string) {
    const checkIns = await this.findAll(userId);
    if (checkIns.length === 0) return null;

    const totals = checkIns.reduce(
      (acc, c) => ({
        stress: acc.stress + c.stress,
        mood: acc.mood + c.mood,
        energy: acc.energy + c.energy,
        sleep: acc.sleep + c.sleep,
      }),
      { stress: 0, mood: 0, energy: 0, sleep: 0 },
    );

    const count = checkIns.length;

    return {
      averages: {
        stress: totals.stress / count,
        mood: totals.mood / count,
        energy: totals.energy / count,
        sleep: totals.sleep / count,
      },
      totalCheckIns: count,
      latestCheckIn: checkIns[0],
    };
  }
}
