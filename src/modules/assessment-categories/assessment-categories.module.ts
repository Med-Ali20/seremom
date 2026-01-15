import { Module } from '@nestjs/common';
import { AssessmentCategoriesService } from './assessment-categories.service';
import { AssessmentCategoriesController } from './assessment-categories.controller';

@Module({
  controllers: [AssessmentCategoriesController],
  providers: [AssessmentCategoriesService],
})
export class AssessmentCategoriesModule {}
