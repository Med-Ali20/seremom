import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AssessmentCategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.assessmentCategory.findMany({ orderBy: { name: 'asc' } });
  }

  create(name: string) {
    return this.prisma.assessmentCategory.create({ data: { name } });
  }

  remove(id: string) {
    return this.prisma.assessmentCategory.delete({ where: { id } });
  }
}