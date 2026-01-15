import { Module } from '@nestjs/common';
import { CheckInsService } from './check-ins.service';
import { CheckInsController } from './check-ins.controller';

@Module({
  controllers: [CheckInsController],
  providers: [CheckInsService],
})
export class CheckInsModule {}
