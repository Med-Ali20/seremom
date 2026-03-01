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
import { PrismaService } from '../prisma/prisma.service';

@Controller('assessments')
export class AssessmentsController {
  constructor(
    private readonly assessmentsService: AssessmentsService,
    private readonly prisma: PrismaService,
  ) {}

  // ── Public ───────────────────────────────────────────────────────────────

  @Get()
  findAll() {
    return this.assessmentsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.assessmentsService.findOne(id);
  }

  // ── Admin only ───────────────────────────────────────────────────────────

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

  // @Post('results')
  // @UseGuards(JwtAuthGuard)
  // async submitResult(
  //   @Body()
  //   body: {
  //     assessmentId: string;
  //     assessmentTitle: string;
  //     answers: any;
  //     totalScore: number;
  //     diagnosis: string;
  //   },
  //   @Req() req: any,
  // ) {
  //   return this.prisma.assessmentResult.create({
  //     data: {
  //       assessmentId: body.assessmentId,
  //       assessmentTitle: body.assessmentTitle,
  //       answers: body.answers,
  //       totalScore: body.totalScore,
  //       diagnosis: body.diagnosis,
  //       userId: req.user.userId,
  //     },
  //   });
  // }

  // @Get('results/me')
  // @UseGuards(JwtAuthGuard)
  // async getMyResults(@Req() req: any) {
  //   return this.prisma.assessmentResult.findMany({
  //     where: { userId: req.user.userId },
  //     orderBy: { createdAt: 'desc' },
  //   });
  // }
}
