import { Module } from '@nestjs/common';
import { SesService } from './ses.service';
import { SnsController } from './sns.controller';
import { SuppressionService } from './suppression.service';
import { UnsubscribeController } from './unsubscribe.controller';

@Module({
  controllers: [SnsController, UnsubscribeController],
  providers: [SesService, SuppressionService],
  exports: [SesService, SuppressionService],
})
export class EmailModule {}