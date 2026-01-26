// articles.controller.ts
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

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('articles')
export class ArticlesController {
  constructor(private readonly articlesService: ArticlesService) {}

  @Post()
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  create(@Body() createArticleDto: CreateArticleDto) {
    return this.articlesService.create(createArticleDto);
  }

  @Get()
  @Roles(Role.ADMIN, Role.SUPERADMIN, Role.USER)
  findAll(
    @Query('search') search?: string,
    @Query('categoryId') categoryId?: string,
    @Query('tags') tags?: string,
  ) {
    const parsedTags = tags ? tags.split(',') : undefined;

    return this.articlesService.findAll({
      search,
      categoryId,
      tags: parsedTags,
    });
  }

  @Get('search')
  @Roles(Role.ADMIN, Role.SUPERADMIN, Role.USER)
  search(
    @Query('q') search?: string,
    @Query('categoryId') categoryId?: string,
    @Query('tags') tags?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('skip', new ParseIntPipe({ optional: true })) skip?: number,
    @Query('take', new ParseIntPipe({ optional: true })) take?: number,
  ) {
    const parsedTags = tags ? tags.split(',') : undefined;

    return this.articlesService.search({
      search,
      categoryId,
      tags: parsedTags,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      skip,
      take,
    });
  }

  @Get('tags')
  @Roles(Role.ADMIN, Role.SUPERADMIN, Role.USER)
  getAllTags() {
    return this.articlesService.getAllTags();
  }

  @Get('category/:categoryId')
  @Roles(Role.ADMIN, Role.SUPERADMIN, Role.USER)
  findByCategory(@Param('categoryId') categoryId: string) {
    return this.articlesService.findByCategory(categoryId);
  }

  @Get('tag/:tag')
  @Roles(Role.ADMIN, Role.SUPERADMIN, Role.USER)
  findByTag(@Param('tag') tag: string) {
    return this.articlesService.findByTag(tag);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.SUPERADMIN, Role.USER)
  findOne(@Param('id') id: string) {
    return this.articlesService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  update(@Param('id') id: string, @Body() updateArticleDto: UpdateArticleDto) {
    return this.articlesService.update(id, updateArticleDto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  remove(@Param('id') id: string) {
    return this.articlesService.remove(id);
  }
}