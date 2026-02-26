
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { SubmitQuestionnaireDto } from './dto/submit-questionnaire.dto';

@Injectable()
export class QuestionnaireService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async submitAnswers(userId: string, dto: SubmitQuestionnaireDto) {
    // Upsert answers (safe to resubmit)
    await this.prisma.questionnaireAnswer.upsert({
      where: { userId },
      create: {
        userId,
        birthTiming: dto.birthTiming,
        healthConditions: dto.healthConditions,
        supportNeeds: dto.supportNeeds,
      },
      update: {
        birthTiming: dto.birthTiming,
        healthConditions: dto.healthConditions,
        supportNeeds: dto.supportNeeds,
      },
    });

    // Mark onboarding complete
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { completedOnboarding: true },
    });

    // Issue a fresh JWT so the middleware sees completedOnboarding: true immediately
    const payload = {
      email: user.email,
      sub: user.id,
      role: user.role,
      completedOnboarding: true,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        firstname: user.firstname,
        lastname: user.lastname,
        role: user.role,
        completedOnboarding: true,
      },
    };
  }

  // Utility for article suggestion — get all tags for a user
  async getUserTags(userId: string): Promise<string[]> {
    const answers = await this.prisma.questionnaireAnswer.findUnique({
      where: { userId },
    });
    if (!answers) return [];
    return [
      ...answers.birthTiming,
      ...answers.healthConditions,
      ...answers.supportNeeds,
    ];
  }
}

