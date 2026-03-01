import { Body, Controller, Post, Req, UseGuards, Get } from '@nestjs/common';
import { QuestionnaireService } from './questionnaire.service';
import { SubmitQuestionnaireDto } from './dto/submit-questionnaire.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('questionnaire')
@UseGuards(JwtAuthGuard)
export class QuestionnaireController {
  constructor(private readonly questionnaireService: QuestionnaireService) {}

  @Post('submit')
  async submit(@Req() req: any, @Body() dto: SubmitQuestionnaireDto) {
    return this.questionnaireService.submitAnswers(req.user?.userId, dto);
  }

  @Get('tags/me')
  async getMyTags(@Req() req: any) {
    return this.questionnaireService.getUserTags(req.user?.userId);
  }
}
