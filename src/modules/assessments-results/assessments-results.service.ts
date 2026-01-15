import { Injectable } from '@nestjs/common';
import { CreateAssessmentsResultDto } from './dto/create-assessments-result.dto';
import { UpdateAssessmentsResultDto } from './dto/update-assessments-result.dto';

@Injectable()
export class AssessmentsResultsService {
  create(createAssessmentsResultDto: CreateAssessmentsResultDto) {
    return 'This action adds a new assessmentsResult';
  }

  findAll() {
    return `This action returns all assessmentsResults`;
  }

  findOne(id: number) {
    return `This action returns a #${id} assessmentsResult`;
  }

  update(id: number, updateAssessmentsResultDto: UpdateAssessmentsResultDto) {
    return `This action updates a #${id} assessmentsResult`;
  }

  remove(id: number) {
    return `This action removes a #${id} assessmentsResult`;
  }
}
