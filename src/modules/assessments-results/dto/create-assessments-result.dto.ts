import { IsArray, IsNotEmpty, IsNumber, IsString, IsUUID, Max, Min, ValidateNested, ArrayMaxSize } from 'class-validator';
import { Type } from 'class-transformer';

export class AnswerDto {
  @IsString()
  @IsNotEmpty()
  question: string;

  @IsString()
  @IsNotEmpty()
  answer: string;

  @IsNumber()
  @Min(0)
  @Max(100)
  score: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  topScore: number;
}

export class CreateAssessmentsResultDto {
  @IsUUID()
  assessmentId: string;

  @IsNumber()
  @Min(0)
  @Max(10000)
  totalScore: number;

  @IsNumber()
  @Min(0)
  @Max(10000)
  topScore: number;

  @IsArray()
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => AnswerDto)
  answers: AnswerDto[];
}