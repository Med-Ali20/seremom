import { Module } from '@nestjs/common';
import { AssessmentsService } from './assessments.service';
import { AssessmentsController } from './assessments.controller';
import { QuestionnaireModule } from '../questionnaire/questionnaire.module';

@Module({
  imports: [QuestionnaireModule],
  controllers: [AssessmentsController],
  providers: [AssessmentsService],
})
export class AssessmentsModule {}