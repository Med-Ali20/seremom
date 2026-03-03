// update-check-in.dto.ts
import { IsInt, IsOptional, IsString, Min, Max, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateCheckInDto {
  @IsOptional()
  @IsInt() @Min(1) @Max(5)
  stress?: number;

  @IsOptional()
  @IsInt() @Min(1) @Max(5)
  mood?: number;

  @IsOptional()
  @IsInt() @Min(1) @Max(5)
  energy?: number;

  @IsOptional()
  @IsInt() @Min(1) @Max(5)
  sleep?: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  @Transform(({ value }) => value?.trim())
  notes?: string;
}