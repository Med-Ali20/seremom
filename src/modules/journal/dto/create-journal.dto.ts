import { IsString, IsOptional, IsDateString, MinLength, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateJournalEntryDto {
  @IsDateString()
  date: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  @Transform(({ value }) => value?.trim())
  title?: string;

  @IsString()
  @MinLength(1)
  @MaxLength(50)
  @Transform(({ value }) => value?.trim())
  feeling: string;

  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  @Transform(({ value }) => value?.trim())
  thoughts: string;
}