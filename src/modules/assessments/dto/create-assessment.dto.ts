import {
  IsString, IsNotEmpty, IsNumber, IsOptional,
  IsBoolean, IsArray, IsObject,
} from 'class-validator';

export class CreateAssessmentDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  duration: number;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @IsBoolean()
  isIndividual?: boolean;

  @IsOptional()
  @IsString()
  categoryId?: string;

  // Array of { id, title, reversed, answers: [{id, text, score}] }
  questions: any;

  // Array of { id, label, description, minPercent, maxPercent }
  diagnoses: any;
}