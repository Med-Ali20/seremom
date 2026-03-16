import { Body, Controller, Post, Req, UseGuards, Get, Param } from '@nestjs/common';
import { QuestionnaireService } from './questionnaire.service';
import { SubmitQuestionnaireDto } from './dto/submit-questionnaire.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';

@Controller('questionnaire')
@UseGuards(JwtAuthGuard)
export class QuestionnaireController {
  constructor(private readonly questionnaireService: QuestionnaireService) {}

  @Post('submit')
  async submit(@Req() req: any, @Body() dto: SubmitQuestionnaireDto) {
    return this.questionnaireService.submitAnswers(req.user?.userId, dto);
  }

  // User fetches their own current answers (to pre-fill the form)
  @Get('me')
  async getMyAnswers(@Req() req: any) {
    return this.questionnaireService.getAnswers(req.user?.userId);
  }

  @Get('tags/me')
  async getMyTags(@Req() req: any) {
    return this.questionnaireService.getUserTags(req.user?.userId);
  }

  // Admin: get all submitted questionnaires
  @Get('admin/all')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  async getAllAnswers() {
    return this.questionnaireService.getAllAnswers();
  }

  // Admin: get a specific user's answers
  @Get('admin/user/:userId')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  async getUserAnswers(@Param('userId') userId: string) {
    return this.questionnaireService.getAnswers(userId);
  }
}