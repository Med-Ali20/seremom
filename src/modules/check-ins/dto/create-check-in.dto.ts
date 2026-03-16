import {
  IsInt,
  IsOptional,
  IsString,
  IsDateString,
  Min,
  Max,
  MaxLength,
  IsIn,
} from 'class-validator';
import { Transform } from 'class-transformer';

export type CheckInSlot = 'MORNING' | 'MIDDAY' | 'EVENING';

export class CreateCheckInDto {
  @IsDateString() // ← accept ISO string, don't try to transform to Date
  date: string;

  @IsIn(['MORNING', 'MIDDAY', 'EVENING'])
  slot: CheckInSlot;

  @IsInt() @Min(1) @Max(5) stress: number;
  @IsInt() @Min(1) @Max(5) mood: number;
  @IsInt() @Min(1) @Max(5) energy: number;
  @IsInt() @Min(1) @Max(5) sleep: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  @Transform(({ value }) => value?.trim())
  notes?: string;
}
