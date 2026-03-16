import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAssessmentsResultDto } from './dto/create-assessments-result.dto';

@Injectable()
export class AssessmentsResultsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateAssessmentsResultDto, userId: string) {
    const assessment = await this.prisma.assessment.findUnique({
      where: { id: dto.assessmentId },
    });
    if (!assessment)
      throw new NotFoundException(`Assessment ${dto.assessmentId} not found`);

    const percent =
      dto.topScore === 0
        ? 0
        : Math.round((dto.totalScore / dto.topScore) * 100);

    const diagnoses = assessment.diagnoses as Array<{
      label: string;
      description: string;
      minPercent: number;
      maxPercent: number;
    }>;
    const matched = diagnoses?.find(
      (d) => percent >= d.minPercent && percent <= d.maxPercent,
    );

    // ── Retake: keep history, increment attempt number ────────────────────
    const lastAttempt = await this.prisma.assessmentResult.findFirst({
      where: { userId, assessmentId: dto.assessmentId },
      orderBy: { attempt: 'desc' },
      select: { attempt: true },
    });

    const nextAttempt = (lastAttempt?.attempt ?? 0) + 1;

    return this.prisma.assessmentResult.create({
      data: {
        assessmentId: dto.assessmentId,
        assessmentTitle: assessment.title,
        answers: dto.answers as any,
        totalScore: dto.totalScore,
        topScore: dto.topScore,
        diagnosis: matched?.label ?? null,
        attempt: nextAttempt,
        userId,
      },
    });
  }

  // ── Latest result per assessment (for dashboard / recommendations) ────────
  async findLatestByUser(userId: string) {
    const all = await this.prisma.assessmentResult.findMany({
      where: { userId },
      orderBy: [{ assessmentId: 'asc' }, { attempt: 'desc' }],
    });

    // Keep only the highest attempt per assessmentId
    const seen = new Map<string, typeof all[0]>();
    for (const r of all) {
      if (!seen.has(r.assessmentId)) seen.set(r.assessmentId, r);
    }
    return [...seen.values()].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }

  // ── Full history for a specific assessment ────────────────────────────────
  async findHistoryByAssessment(userId: string, assessmentId: string) {
    return this.prisma.assessmentResult.findMany({
      where: { userId, assessmentId },
      orderBy: { attempt: 'desc' },
    });
  }

  // ── All results for this user (all attempts) ──────────────────────────────
  async findAllByUser(userId: string) {
    return this.prisma.assessmentResult.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAll() {
    return this.prisma.assessmentResult.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, email: true, firstname: true, lastname: true },
        },
      },
    });
  }

  async findOne(id: string) {
    const result = await this.prisma.assessmentResult.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, email: true, firstname: true, lastname: true },
        },
      },
    });
    if (!result) throw new NotFoundException(`Result ${id} not found`);
    return result;
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.assessmentResult.delete({ where: { id } });
    return { message: `Result ${id} removed` };
  }
}