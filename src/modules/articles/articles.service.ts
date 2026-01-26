// articles.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ArticlesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createArticleDto: CreateArticleDto) {
    const { categoryId, tags, ...articleData } = createArticleDto;

    return this.prisma.article.create({
      data: {
        ...articleData,
        tags: tags || [],
        category: categoryId
          ? {
              connect: { id: categoryId },
            }
          : undefined,
      },
      include: {
        category: true,
      },
    });
  }

  async findAll(query?: {
    search?: string;
    categoryId?: string;
    tags?: string[];
  }) {
    const where: any = {};

    // Search by title, description, or content
    if (query?.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
        { content: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    // Filter by category
    if (query?.categoryId) {
      where.categoryId = query.categoryId;
    }

    // Filter by tags (articles that have ANY of the specified tags)
    if (query?.tags && query.tags.length > 0) {
      where.tags = {
        hasSome: query.tags,
      };
    }

    return this.prisma.article.findMany({
      where,
      include: {
        category: true,
      },
      orderBy: {
        date: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const article = await this.prisma.article.findUnique({
      where: { id },
      include: {
        category: true,
      },
    });

    if (!article) {
      throw new NotFoundException(`Article with ID ${id} not found`);
    }

    return article;
  }

  async update(id: string, updateArticleDto: UpdateArticleDto) {
    const { categoryId, tags, ...articleData } = updateArticleDto;

    // Check if article exists
    await this.findOne(id);

    return this.prisma.article.update({
      where: { id },
      data: {
        ...articleData,
        tags: tags !== undefined ? tags : undefined,
        category: categoryId
          ? {
              connect: { id: categoryId },
            }
          : categoryId === null
          ? {
              disconnect: true,
            }
          : undefined,
      },
      include: {
        category: true,
      },
    });
  }

  async remove(id: string) {
    // Check if article exists
    await this.findOne(id);

    await this.prisma.article.delete({
      where: { id },
    });

    return { message: `Article with ID ${id} has been removed` };
  }

  // Advanced search with pagination
  async search(params: {
    search?: string;
    categoryId?: string;
    tags?: string[];
    startDate?: Date;
    endDate?: Date;
    skip?: number;
    take?: number;
  }) {
    const {
      search,
      categoryId,
      tags,
      startDate,
      endDate,
      skip = 0,
      take = 10,
    } = params;

    const where: any = {};

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (tags && tags.length > 0) {
      where.tags = {
        hasSome: tags,
      };
    }

    // Filter by date range
    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        where.date.gte = startDate;
      }
      if (endDate) {
        where.date.lte = endDate;
      }
    }

    const [articles, total] = await Promise.all([
      this.prisma.article.findMany({
        where,
        include: {
          category: true,
        },
        orderBy: {
          date: 'desc',
        },
        skip,
        take,
      }),
      this.prisma.article.count({ where }),
    ]);

    return {
      data: articles,
      meta: {
        total,
        skip,
        take,
        pages: Math.ceil(total / take),
      },
    };
  }

  // Get articles by category
  async findByCategory(categoryId: string) {
    return this.prisma.article.findMany({
      where: {
        categoryId,
      },
      include: {
        category: true,
      },
      orderBy: {
        date: 'desc',
      },
    });
  }

  // Get articles by tag
  async findByTag(tag: string) {
    return this.prisma.article.findMany({
      where: {
        tags: {
          has: tag,
        },
      },
      include: {
        category: true,
      },
      orderBy: {
        date: 'desc',
      },
    });
  }

  // Get all unique tags
  async getAllTags() {
    const articles = await this.prisma.article.findMany({
      select: {
        tags: true,
      },
    });

    const allTags = articles.flatMap((article) => article.tags);
    const uniqueTags = [...new Set(allTags)];

    return uniqueTags.sort();
  }
}