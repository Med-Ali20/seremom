import { Module } from '@nestjs/common';
import { UploadController } from './upload.controller';
import { MulterModule } from '@nestjs/platform-express';
import { join } from 'path';

@Module({
  imports: [
    MulterModule.register({ dest: join(process.cwd(), 'uploads') }),
  ],
  controllers: [UploadController],
})
export class UploadModule {}