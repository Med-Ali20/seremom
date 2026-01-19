import { IsString, IsOptional, IsDateString, MinLength } from 'class-validator';

export class CreateJournalEntryDto {
  @IsDateString()
  date: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  title?: string;

  @IsString()
  @MinLength(1)
  feeling: string;

  @IsString()
  @MinLength(1)
  thoughts: string;
}