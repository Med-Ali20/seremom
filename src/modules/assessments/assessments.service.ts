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
        isIndividual: dto.isIndividual ?? true,
        categoryId: dto.categoryId,
      },
    });
  }

  async findAll() {
    return this.prisma.assessment.findMany({
      include: { category: true },
      orderBy: { createdAt: 'desc' },
    });
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