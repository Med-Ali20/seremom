import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { SubmitQuestionnaireDto } from './dto/submit-questionnaire.dto';

function normalizeAnswersToTags(answers: {
  birthTiming: string[];
  healthConditions: string[];
  supportNeeds: string[];
}): string[] {
  const raw = [
    ...answers.birthTiming,
    ...answers.healthConditions,
    ...answers.supportNeeds,
  ];

  const tagMap: Record<string, string[]> = {
    '0–6 weeks postpartum': ['postpartum', 'newborn'],
    '7–12 weeks postpartum': ['postpartum'],
    '3–6 months postpartum': ['postpartum'],
    '6–12 months postpartum': ['postpartum'],
    '1–2 years postpartum': ['postpartum'],
    '2–5 years postpartum': ['postpartum'],
    Migraine: ['migraine', 'headache', 'pain'],
    'Chronic headaches (non-migraine)': ['headache', 'pain'],
    'Epilepsy or seizure disorder': ['epilepsy', 'neurological'],
    'Multiple sclerosis (MS)': ['ms', 'neurological'],
    'Neuropathy (nerve pain or numbness)': ['neuropathy', 'pain'],
    'Carpal tunnel syndrome': ['carpal tunnel', 'pain'],
    'Chronic pain condition': ['chronic pain', 'pain'],
    Fibromyalgia: ['fibromyalgia', 'pain', 'fatigue'],
    Hypothyroidism: ['thyroid', 'hypothyroidism'],
    Hyperthyroidism: ['thyroid', 'hyperthyroidism'],
    "Hashimoto's thyroiditis": ['hashimoto', 'thyroid', 'autoimmune'],
    'Polycystic ovary syndrome (PCOS)': ['pcos', 'hormones'],
    Endometriosis: ['endometriosis'],
    'Autoimmune disease (for example lupus or rheumatoid arthritis)': [
      'autoimmune',
      'lupus',
      'arthritis',
    ],
    'Iron-deficiency anemia': ['anemia', 'fatigue'],
    'Anxiety (past or present)': ['anxiety', 'mental health'],
    'Depression (past or present)': ['depression', 'mental health'],
    'Trauma or PTSD history': ['trauma', 'ptsd', 'mental health'],
    ADHD: ['adhd', 'mental health'],
    'Chronic fatigue or low energy': ['fatigue', 'energy'],
    'Insomnia or significant sleep disruption': ['sleep', 'insomnia'],
    'History of pregnancy or birth complications': [
      'birth',
      'pregnancy',
      'complications',
    ],
    "Understanding what I'm experiencing": ['education', 'postpartum'],
    'Managing stress or emotional overload': [
      'stress',
      'mental health',
      'anxiety',
    ],
    'Improving sleep or daily functioning': ['sleep', 'wellness'],
    'Feeling more grounded and regulated': [
      'mental health',
      'wellness',
      'stress',
    ],
    'Navigating motherhood with ongoing health conditions': [
      'chronic illness',
      'motherhood',
    ],
    'Knowing when to seek additional support': ['support', 'mental health'],
    'Just exploring and learning': ['education', 'wellness'],
  };

  const tags = new Set<string>();
  for (const answer of raw) {
    const mapped = tagMap[answer];
    if (mapped) {
      mapped.forEach((t) => tags.add(t));
    } else {
      tags.add(answer.toLowerCase());
    }
  }

  return [...tags];
}

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

  async getUserTags(userId: string): Promise<string[]> {
    const answers = await this.prisma.questionnaireAnswer.findUnique({
      where: { userId },
    });
    if (!answers) return [];
    return normalizeAnswersToTags(answers);
  }
}
