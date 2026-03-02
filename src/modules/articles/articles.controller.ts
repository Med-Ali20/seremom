import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { ArticlesService } from './articles.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { RolesGuard } from '../auth/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Role } from '../auth/enums/role.enum';
import { Roles } from '../auth/decorators/roles.decorator';
import { Throttle } from '@nestjs/throttler';

@Controller('articles')
export class ArticlesController {
  constructor(private readonly articlesService: ArticlesService) {}

  // ── Public GET routes (no auth required) ────────────────────────────────────

  @Get()
  @Throttle({ default: { ttl: 60000, limit: 60 } })
  findAll(
    @Query('search') search?: string,
    @Query('categoryId') categoryId?: string,
    @Query('tags') tags?: string,
  ) {
    return this.articlesService.findAll({
      search,
      categoryId,
      tags: tags ? tags.split(',') : undefined,
      include: { category: true }
    });
  }

  @Get('search')
  @Throttle({ default: { ttl: 60000, limit: 30 } }) // 30 searches/min
  search(
    @Query('q') search?: string,
    @Query('categoryId') categoryId?: string,
    @Query('tags') tags?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('skip', new ParseIntPipe({ optional: true })) skip?: number,
    @Query('take', new ParseIntPipe({ optional: true })) take?: number,
  ) {
    return this.articlesService.search({
      search,
      categoryId,
      tags: tags ? tags.split(',') : undefined,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      skip,
      take,
    });
  }

  @Get('tags')
  getAllTags() {
    return this.articlesService.getAllTags();
  }

  @Get('category/:categoryId')
  findByCategory(@Param('categoryId') categoryId: string) {
    return this.articlesService.findByCategory(categoryId);
  }

  @Get('tag/:tag')
  findByTag(@Param('tag') tag: string) {
    return this.articlesService.findByTag(tag);
  }

  @Get('categories')
  getCategories() {
    return this.articlesService.getCategories();
  }

  @Post('categories')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  createCategory(@Body() body: { name: string }) {
    return this.articlesService.createCategory(body.name);
  }

  @Delete('categories/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  deleteCategory(@Param('id') id: string) {
    return this.articlesService.deleteCategory(id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.articlesService.findOne(id);
  }

  // ── Admin-only write routes ──────────────────────────────────────────────────

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  create(@Body() createArticleDto: CreateArticleDto) {
    return this.articlesService.create(createArticleDto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  update(@Param('id') id: string, @Body() updateArticleDto: UpdateArticleDto) {
    return this.articlesService.update(id, updateArticleDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  remove(@Param('id') id: string) {
    return this.articlesService.remove(id);
  }
}
