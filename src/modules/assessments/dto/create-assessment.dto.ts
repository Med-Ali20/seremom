import { IsString, IsNotEmpty } from 'class-validator';

//  id          String       @id @default(uuid())
//   title       String
//   description String?
//   duration    Int
//   isIndividual Boolean     @default(true)
//   category    Category?    @relation(fields: [categoryId], references: [id])
//   categoryId  String?
//   questions   Question[]
//   diagnoses   Diagnosis[]
//   validated   Boolean      @default(false)
//   icon        String?
//   createdAt   DateTime     @default(now())

export class CreateAssessmentDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  description?: string;

  @IsNotEmpty()
  duration?: number;

  isIndividual: boolean;

  categoryId: string;

  icon?: string;

  validated?: boolean;
}
