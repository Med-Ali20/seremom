import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { EmailModule } from '../email/email.module';
import { CampaignsService } from './campaigns.service';
import { CampaignsController } from './campaigns.controller';
import { CampaignsProcessor } from './campaigns.processor';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [EmailModule, BullModule.registerQueue({ name: 'campaign-send' }), AuthModule],
  controllers: [CampaignsController],
  providers: [CampaignsService, CampaignsProcessor],
})
export class CampaignsModule {}