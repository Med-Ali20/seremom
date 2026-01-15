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

@Module({
  imports: [UsersModule, ConfigModule.forRoot(), PrismaModule, CheckInsModule, AssessmentsModule, AssessmentsResultsModule, JournalModule, AssessmentCategoriesModule, AuthModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
