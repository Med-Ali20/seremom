import { IsArray, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export interface Answer {
  question: string;
  answer: string;
  score: number;
  topScore: number;
}

export class CreateAssessmentsResultDto {
    @IsString()
    @IsNotEmpty()
    assessmentId: string;

    @IsNumber()
    @IsNotEmpty()
    totalScore: number;

    @IsNumber()
    @IsNotEmpty()
    topScore: number;

    @IsArray()
    @IsNotEmpty()
    answers: Answer[];  
}
