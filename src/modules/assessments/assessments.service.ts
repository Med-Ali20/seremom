import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAssessmentDto } from './dto/create-assessment.dto';
import { UpdateAssessmentDto } from './dto/update-assessment.dto';

@Injectable()
export class AssessmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateAssessmentDto) {
    return this.prisma.assessment.create({
      data: {
        title: dto.title,
        description: dto.description,
        duration: dto.duration,
        icon: dto.icon,
        questions: dto.questions,
        diagnoses: dto.diagnoses,
        tags: dto.tags ?? [],
        isIndividual: dto.isIndividual ?? true,
        categoryId: dto.categoryId,
      },
      include: { category: true },
    });
  }

  async findAll() {
    return this.prisma.assessment.findMany({
      include: { category: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ── NEW: get all assessments for a given category ─────────────────────────
  async findByCategory(categoryId: string) {
    return this.prisma.assessment.findMany({
      where: { categoryId },
      include: { category: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ── NEW: recommended assessments based on user tags ───────────────────────
  // Returns assessments whose tags overlap with the user's questionnaire tags,
  // sorted by overlap count descending, limited to `limit`.
  async findRecommended(userTags: string[], limit = 5): Promise<any[]> {
    // Only consider assessments that have at least one tag
    const tagged = await this.prisma.assessment.findMany({
      where: { tags: { isEmpty: false } },
      include: { category: true },
    });

    if (tagged.length === 0 || userTags.length === 0) return [];

    // Score by tag overlap, keep only those with at least one match
    return tagged
      .map((a) => ({
        ...a,
        _score: a.tags.filter((t) => userTags.includes(t)).length,
      }))
      .filter((a) => a._score > 0)
      .sort((a, b) => b._score - a._score)
      .slice(0, limit);
  }

  async findOne(id: string) {
    const assessment = await this.prisma.assessment.findUnique({
      where: { id },
      include: { category: true },
    });
    if (!assessment) throw new NotFoundException(`Assessment ${id} not found`);
    return assessment;
  }

  async update(id: string, dto: UpdateAssessmentDto) {
    await this.findOne(id);
    return this.prisma.assessment.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.duration !== undefined && { duration: dto.duration }),
        ...(dto.icon !== undefined && { icon: dto.icon }),
        ...(dto.questions !== undefined && { questions: dto.questions }),
        ...(dto.diagnoses !== undefined && { diagnoses: dto.diagnoses }),
        ...(dto.tags !== undefined && { tags: dto.tags }),
        ...(dto.isIndividual !== undefined && { isIndividual: dto.isIndividual }),
        ...(dto.categoryId !== undefined && { categoryId: dto.categoryId }),
      },
      include: { category: true },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.assessment.delete({ where: { id } });
    return { message: `Assessment ${id} removed` };
  }
}