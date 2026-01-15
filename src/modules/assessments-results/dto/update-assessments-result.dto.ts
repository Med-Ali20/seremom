import { PartialType } from '@nestjs/mapped-types';
import { CreateAssessmentsResultDto } from './create-assessments-result.dto';

export class UpdateAssessmentsResultDto extends PartialType(CreateAssessmentsResultDto) {}
