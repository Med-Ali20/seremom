import { IsString, IsOptional, IsArray, IsUUID, MaxLength, MinLength, ArrayMaxSize, IsIn } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateArticleDto {
  @IsString()
  @MinLength(1)
  @MaxLength(300)
  @Transform(({ value }) => value?.trim())
  title: string;

  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  @Transform(({ value }) => value?.trim())
  description: string;

  @IsString()
  @MaxLength(20)
  @Transform(({ value }) => value?.trim())
  duration: string;

  @IsString()
  @MinLength(1)
  @MaxLength(100000)
  content: string;

  @IsString()
  @MaxLength(500)
  image: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @MaxLength(50, { each: true })
  tags: string[];

  @IsString()
  date: string;

  @IsOptional()
  @IsIn(['published', 'draft'])
  status?: string;
}