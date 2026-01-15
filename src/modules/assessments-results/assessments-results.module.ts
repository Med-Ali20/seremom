import { Module } from '@nestjs/common';
import { AssessmentsResultsService } from './assessments-results.service';
import { AssessmentsResultsController } from './assessments-results.controller';

@Module({
  controllers: [AssessmentsResultsController],
  providers: [AssessmentsResultsService],
})
export class AssessmentsResultsModule {}
