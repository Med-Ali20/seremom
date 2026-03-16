import { Controller, Get, Post, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { AssessmentsResultsService } from './assessments-results.service';
import { CreateAssessmentsResultDto } from './dto/create-assessments-result.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';

@Controller('assessment-results')
@UseGuards(JwtAuthGuard)
export class AssessmentsResultsController {
  constructor(private readonly service: AssessmentsResultsService) {}

  // Submit a result (creates new attempt, keeps history)
  @Post()
  create(@Body() dto: CreateAssessmentsResultDto, @Req() req: any) {
    return this.service.create(dto, req.user.userId);
  }

  // Latest result per assessment (used by dashboard + recommendations)
  @Get('me')
  getMyResults(@Req() req: any) {
    return this.service.findLatestByUser(req.user.userId);
  }

  // Full attempt history for a specific assessment
  @Get('me/history/:assessmentId')
  getHistory(@Param('assessmentId') assessmentId: string, @Req() req: any) {
    return this.service.findHistoryByAssessment(req.user.userId, assessmentId);
  }

  // All attempts across all assessments (for "See all results" page)
  @Get('me/all')
  getAllMyResults(@Req() req: any) {
    return this.service.findAllByUser(req.user.userId);
  }

  // Admin
  @Get()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}