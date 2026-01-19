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
import { JournalService } from './journal.service';
import { CreateJournalEntryDto } from './dto/create-journal.dto';
import { UpdateJournalEntryDto } from './dto/update-journal.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('journal')
@UseGuards(JwtAuthGuard) // 🔒 ALL routes require authentication
export class JournalController {
  constructor(private readonly journalService: JournalService) {}

  @Post()
  create(
    @CurrentUser() user: { userId: string; email: string },
    @Body() createDto: CreateJournalEntryDto,
  ) {
    // user.userId is extracted from JWT token
    return this.journalService.create(user.userId, createDto);
  }

  @Get()
  findAll(@CurrentUser() user: { userId: string; email: string }) {
    return this.journalService.findAll(user.userId);
  }

  @Get('search')
  searchByFeeling(
    @CurrentUser() user: { userId: string; email: string },
    @Query('feeling') feeling: string,
  ) {
    return this.journalService.searchByFeeling(user.userId, feeling);
  }

  @Get('range')
  findByDateRange(
    @CurrentUser() user: { userId: string; email: string },
    @Query('start') start: string,
    @Query('end') end: string,
  ) {
    return this.journalService.findByDateRange(
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
    return this.journalService.findOne(id, user.userId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @CurrentUser() user: { userId: string; email: string },
    @Body() updateDto: UpdateJournalEntryDto,
  ) {
    return this.journalService.update(id, user.userId, updateDto);
  }

  @Delete(':id')
  remove(
    @Param('id') id: string,
    @CurrentUser() user: { userId: string; email: string },
  ) {
    return this.journalService.remove(id, user.userId);
  }
}
