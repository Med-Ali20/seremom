import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { AssessmentsResultsService } from './assessments-results.service';
import { CreateAssessmentsResultDto } from './dto/create-assessments-result.dto';
import { UpdateAssessmentsResultDto } from './dto/update-assessments-result.dto';

@Controller('assessments-results')
export class AssessmentsResultsController {
  constructor(private readonly assessmentsResultsService: AssessmentsResultsService) {}

  @Post()
  create(@Body() createAssessmentsResultDto: CreateAssessmentsResultDto) {
    return this.assessmentsResultsService.create(createAssessmentsResultDto);
  }

  @Get()
  findAll() {
    return this.assessmentsResultsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.assessmentsResultsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAssessmentsResultDto: UpdateAssessmentsResultDto) {
    return this.assessmentsResultsService.update(+id, updateAssessmentsResultDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.assessmentsResultsService.remove(+id);
  }
}
