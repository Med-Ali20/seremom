import { Controller, Get, Post, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { AssessmentsResultsService } from './assessments-results.service';
import { CreateAssessmentsResultDto } from './dto/create-assessments-result.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';

@Controller('assessments/results')
@UseGuards(JwtAuthGuard)
export class AssessmentsResultsController {
  constructor(private readonly service: AssessmentsResultsService) {}

  // User submits their result
  @Post()
  create(@Body() dto: CreateAssessmentsResultDto, @Req() req: any) {
    return this.service.create(dto, req.user.userId);
  }

  // User fetches their own results
  @Get('me')
  getMyResults(@Req() req: any) {
    return this.service.findAllByUser(req.user.userId);
  }

  // Admin fetches all results
  @Get()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  findAll() {
    return this.service.findAll();
  }

  // Admin fetches single result
  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  // Admin deletes a result
  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}