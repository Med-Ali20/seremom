import { IsString, IsNotEmpty } from 'class-validator';

export class CreateAssessmentDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  description?: string;

  @IsNotEmpty()
  duration?: number;

  isIndividual: boolean;

  categoryId: string;

  icon?: string;

  validated?: boolean;
}
