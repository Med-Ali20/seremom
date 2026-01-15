import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { AssessmentCategoriesService } from './assessment-categories.service';
import { CreateAssessmentCategoryDto } from './dto/create-assessment-category.dto';
import { UpdateAssessmentCategoryDto } from './dto/update-assessment-category.dto';

@Controller('assessment-categories')
export class AssessmentCategoriesController {
  constructor(private readonly assessmentCategoriesService: AssessmentCategoriesService) {}

  @Post()
  create(@Body() createAssessmentCategoryDto: CreateAssessmentCategoryDto) {
    return this.assessmentCategoriesService.create(createAssessmentCategoryDto);
  }

  @Get()
  findAll() {
    return this.assessmentCategoriesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.assessmentCategoriesService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAssessmentCategoryDto: UpdateAssessmentCategoryDto) {
    return this.assessmentCategoriesService.update(+id, updateAssessmentCategoryDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.assessmentCategoriesService.remove(+id);
  }
}
