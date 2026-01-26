import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { ConfigModule } from '@nestjs/config/dist/config.module';

@Module({
  controllers: [ChatController],
  providers: [ChatService],
  imports: [ConfigModule],
})
export class ChatModule {}
