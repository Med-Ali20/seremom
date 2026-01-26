// dto/create-article.dto.ts
import {
  IsString,
  IsOptional,
  IsArray,
  IsDateString,
  IsUUID,
} from 'class-validator';

export class CreateArticleDto {
  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsString()
  duration: string;

  @IsString()
  content: string;

  @IsString()
  image: string;

  @IsUUID()
  @IsOptional()
  categoryId?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @IsDateString()
  date: string;
}