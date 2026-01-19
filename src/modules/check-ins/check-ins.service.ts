import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCheckInDto } from './dto/create-check-in.dto';
import { UpdateCheckInDto } from './dto/update-check-in.dto';

@Injectable()
export class CheckInsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, createCheckInDto: CreateCheckInDto) {
    return this.prisma.checkIn.create({
      data: {
        ...createCheckInDto,
        date: new Date(createCheckInDto.date),
        userId, // Automatically associate with the authenticated user
      },
    });
  }

  async findAll(userId: string) {
    // Only return check-ins for the authenticated user
    return this.prisma.checkIn.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
    });
  }

  async findOne(id: string, userId: string) {
    const checkIn = await this.prisma.checkIn.findUnique({
      where: { id },
    });

    if (!checkIn) {
      throw new NotFoundException('Check-in not found');
    }

    // Ensure the check-in belongs to the authenticated user
    if (checkIn.userId !== userId) {
      throw new ForbiddenException('You can only access your own check-ins');
    }

    return checkIn;
  }

  async findByDateRange(userId: string, startDate: Date, endDate: Date) {
    return this.prisma.checkIn.findMany({
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

  async update(id: string, userId: string, updateCheckInDto: UpdateCheckInDto) {
    // First verify ownership
    await this.findOne(id, userId);

    return this.prisma.checkIn.update({
      where: { id },
      data: {
        ...updateCheckInDto,
        ...(updateCheckInDto.date && { date: new Date(updateCheckInDto.date) }),
      },
    });
  }

  async remove(id: string, userId: string) {
    // First verify ownership
    await this.findOne(id, userId);

    return this.prisma.checkIn.delete({
      where: { id },
    });
  }

  async getStats(userId: string) {
    const checkIns = await this.findAll(userId);

    if (checkIns.length === 0) {
      return null;
    }

    const totals = checkIns.reduce(
      (acc, checkIn) => ({
        stress: acc.stress + checkIn.stress,
        mood: acc.mood + checkIn.mood,
        energy: acc.energy + checkIn.energy,
        sleep: acc.sleep + checkIn.sleep,
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