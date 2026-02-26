import { IsArray, IsString, ArrayMinSize } from 'class-validator';

export class SubmitQuestionnaireDto {
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  birthTiming: string[];

  @IsArray()
  @IsString({ each: true })
  healthConditions: string[];

  @IsArray()
  @IsString({ each: true })
  supportNeeds: string[];
}