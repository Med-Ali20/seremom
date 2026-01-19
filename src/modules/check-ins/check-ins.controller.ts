import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { CheckInsService } from './check-ins.service';
import { CreateCheckInDto } from './dto/create-check-in.dto';
import { UpdateCheckInDto } from './dto/update-check-in.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('check-ins')
@UseGuards(JwtAuthGuard) // Protect ALL routes in this controller
export class CheckInsController {
  constructor(private readonly checkInsService: CheckInsService) {}

  @Post()
  create(
    @CurrentUser() user: { userId: string; email: string },
    @Body() createCheckInDto: CreateCheckInDto,
  ) {
    return this.checkInsService.create(user.userId, createCheckInDto);
  }

  @Get()
  findAll(@CurrentUser() user: { userId: string; email: string }) {
    return this.checkInsService.findAll(user.userId);
  }

  @Get('stats')
  getStats(@CurrentUser() user: { userId: string; email: string }) {
    return this.checkInsService.getStats(user.userId);
  }

  @Get('range')
  findByDateRange(
    @CurrentUser() user: { userId: string; email: string },
    @Query('start') start: string,
    @Query('end') end: string,
  ) {
    return this.checkInsService.findByDateRange(
      user.userId,
      new Date(start),
      new Date(end),
    );
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @CurrentUser() user: { userId: string; email: string },
  ) {
    return this.checkInsService.findOne(id, user.userId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @CurrentUser() user: { userId: string; email: string },
    @Body() updateCheckInDto: UpdateCheckInDto,
  ) {
    return this.checkInsService.update(id, user.userId, updateCheckInDto);
  }

  @Delete(':id')
  remove(
    @Param('id') id: string,
    @CurrentUser() user: { userId: string; email: string },
  ) {
    return this.checkInsService.remove(id, user.userId);
  }
}