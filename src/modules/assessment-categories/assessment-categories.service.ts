import { Injectable } from '@nestjs/common';
import { CreateAssessmentCategoryDto } from './dto/create-assessment-category.dto';
import { UpdateAssessmentCategoryDto } from './dto/update-assessment-category.dto';

@Injectable()
export class AssessmentCategoriesService {
  create(createAssessmentCategoryDto: CreateAssessmentCategoryDto) {
    return 'This action adds a new assessmentCategory';
  }

  findAll() {
    return `This action returns all assessmentCategories`;
  }

  findOne(id: number) {
    return `This action returns a #${id} assessmentCategory`;
  }

  update(id: number, updateAssessmentCategoryDto: UpdateAssessmentCategoryDto) {
    return `This action updates a #${id} assessmentCategory`;
  }

  remove(id: number) {
    return `This action removes a #${id} assessmentCategory`;
  }
}
