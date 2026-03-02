import { IsString, MinLength, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class SendMessageDto {
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  @Transform(({ value }) => value?.trim())
  message: string;
}