import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AssessmentsService } from './assessments.service';
import { CreateAssessmentDto } from './dto/create-assessment.dto';
import { UpdateAssessmentDto } from './dto/update-assessment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { QuestionnaireService } from '../questionnaire/questionnaire.service';

@Controller('assessments')
export class AssessmentsController {
  constructor(
    private readonly assessmentsService: AssessmentsService,
    private readonly questionnaireService: QuestionnaireService,
  ) {}

  // ── Public ────────────────────────────────────────────────────────────────

  @Get()
  findAll() {
    return this.assessmentsService.findAll();
  }

  @Get('by-category/:categoryId')
  findByCategory(@Param('categoryId') categoryId: string) {
    console.log('Finding assessments for category:', categoryId);
    return this.assessmentsService.findByCategory(categoryId);
  }

  // ── Authenticated ─────────────────────────────────────────────────────────

  // Returns recommended assessments based on the user's questionnaire tags
  @Get('recommended')
  @UseGuards(JwtAuthGuard)
  async getRecommended(@Req() req: any) {
    const tags = await this.questionnaireService.getUserTags(req.user.userId);
    return this.assessmentsService.findRecommended(tags, 5);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.assessmentsService.findOne(id);
  }

  // ── Admin only ────────────────────────────────────────────────────────────

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  create(@Body() dto: CreateAssessmentDto) {
    return this.assessmentsService.create(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateAssessmentDto) {
    return this.assessmentsService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  remove(@Param('id') id: string) {
    return this.assessmentsService.remove(id);
  }
}