import { IsInt, IsOptional, IsString, Min, Max, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateCheckInDto {
  @Transform(({ value }) => new Date(value))
  date: Date;

  @IsInt()
  @Min(1)
  @Max(5)
  stress: number;

  @IsInt()
  @Min(1)
  @Max(5)
  mood: number;

  @IsInt()
  @Min(1)
  @Max(5)
  energy: number;

  @IsInt()
  @Min(1)
  @Max(5)
  sleep: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  @Transform(({ value }) => value?.trim())
  notes?: string;
}