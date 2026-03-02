import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './modules/users/users.module';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './modules/prisma/prisma.module';
import { CheckInsModule } from './modules/check-ins/check-ins.module';
import { AssessmentsModule } from './modules/assessments/assessments.module';
import { AssessmentsResultsModule } from './modules/assessments-results/assessments-results.module';
import { JournalModule } from './modules/journal/journal.module';
import { AssessmentCategoriesModule } from './modules/assessment-categories/assessment-categories.module';
import { AuthModule } from './modules/auth/auth.module';
import { AdminModule } from './modules/admin/admin.module';
import { ChatModule } from './modules/chat/chat.module';
import { ArticlesModule } from './modules/articles/articles.module';
import { QuestionnaireModule } from './modules/questionnaire/questionnaire.module';
import { UploadModule } from './modules/upload/upload.module';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [
    UsersModule,
    ConfigModule.forRoot(),
    PrismaModule,
    CheckInsModule,
    AssessmentsModule,
    AssessmentsResultsModule,
    JournalModule,
    AssessmentCategoriesModule,
    AuthModule,
    AdminModule,
    ChatModule,
    ArticlesModule,
    QuestionnaireModule,
    UploadModule,
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000, // 1 second
        limit: 20, // 5 requests per second
      },
      {
        name: 'medium',
        ttl: 60000, // 1 minute
        limit: 150, // 100 requests per minute
      },
      {
        name: 'long',
        ttl: 3600000, // 1 hour
        limit: 1000, // 1000 requests per hour
      },
    ]),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
