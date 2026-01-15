import { IsDate, IsInt, IsOptional, IsString, Min, Max } from 'class-validator';

export class CreateCheckInDto {
  @IsDate()
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
  notes?: string;
}

