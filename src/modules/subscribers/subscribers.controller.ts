import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { SubscribersService } from './subscribers.service';
import { SubscribeDto } from './dto/subscribe.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';

@Controller('newsletter/subscribers')
export class SubscribersController {
  constructor(private readonly subscribers: SubscribersService) {}

  // Exposes every subscriber's email — admin only.
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  list() {
    return this.subscribers.list();
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  stats() {
    return this.subscribers.stats();
  }

  // Public signup form — stays unauthenticated by design, but throttled
  // against bot-driven mass signups / DB pollution.
  @Post()
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  subscribe(@Body() body: SubscribeDto) {
    return this.subscribers.subscribe(body);
  }
}