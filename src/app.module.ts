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

@Module({
  imports: [UsersModule, ConfigModule.forRoot(), PrismaModule, CheckInsModule, AssessmentsModule, AssessmentsResultsModule, JournalModule, AssessmentCategoriesModule, AuthModule, AdminModule, ChatModule, ArticlesModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
