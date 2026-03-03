import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsArray,
  IsObject,
  IsDefined,
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
  @IsArray() // Explicitly tell Nest this is an array
  @IsDefined()
  questions: any;

  @IsArray() // Explicitly tell Nest this is an array
  @IsDefined()
  diagnoses: any;
}
