// articles.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { PrismaService } from '../prisma/prisma.service';
import {
  sanitizeSearch,
  sanitizePagination,
} from '../../common/utils/sanitize-search';

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
    include: { category: true };
  }) {
    const where: any = {};

    if (query?.search) {
      const q = sanitizeSearch(query.search);
      if (q) {
        where.OR = [
          { title: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
        ];
      }
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
  async search(params: {
    search?: string;
    categoryId?: string;
    tags?: string[];
    startDate?: Date;
    endDate?: Date;
    skip?: number;
    take?: number;
  }) {
    const { search, categoryId, tags, startDate, endDate } = params;
    const { skip, take } = sanitizePagination(params.skip, params.take);

    const where: any = { status: 'published' };

    if (search) {
      const q = sanitizeSearch(search);
      if (q) {
        where.OR = [
          { title: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
        ];
      }
    }

    if (categoryId) where.categoryId = categoryId;

    if (tags?.length) {
      where.tags = { hasSome: tags.slice(0, 10) };
    }

    if (startDate || endDate) {
      where.date = {
        ...(startDate && { gte: startDate }),
        ...(endDate && { lte: endDate }),
      };
    }

    const [articles, total] = await Promise.all([
      this.prisma.article.findMany({
        where,
        include: { category: true },
        orderBy: { date: 'desc' },
        skip,
        take,
      }),
      this.prisma.article.count({ where }),
    ]);

    return {
      data: articles,
      meta: { total, skip, take, pages: Math.ceil(total / take) },
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

  async getCategories() {
    return this.prisma.articleCategory.findMany({ orderBy: { name: 'asc' } });
  }

  async createCategory(name: string) {
    return this.prisma.articleCategory.create({ data: { name } });
  }

  async deleteCategory(id: string) {
    return this.prisma.articleCategory.delete({ where: { id } });
  }
}
