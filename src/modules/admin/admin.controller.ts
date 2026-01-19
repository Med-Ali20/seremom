import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '../auth/enums/role.enum';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard) // Apply both guards
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // Only SUPERADMIN can create admins
  @Post('admins')
  @Roles(Role.SUPERADMIN)
  createAdmin(
    @Body() body: { email: string; password: string; name?: string },
  ) {
    return this.adminService.createAdmin(body.email, body.password, body.name);
  }

  // Both ADMIN and SUPERADMIN can view admins
  @Get('admins')
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  getAllAdmins() {
    return this.adminService.getAllAdmins();
  }

  // Both ADMIN and SUPERADMIN can view all users
  @Get('users')
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  getAllUsers() {
    return this.adminService.getAllUsers();
  }

  // Only SUPERADMIN can delete admins
  @Delete('admins/:id')
  @Roles(Role.SUPERADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteAdmin(
    @Param('id') id: string,
    @CurrentUser() user: { userId: string; email: string; role: Role },
  ) {
    return this.adminService.deleteAdmin(id, user.userId);
  }

  // Only SUPERADMIN can update roles
  @Patch('users/:id/role')
  @Roles(Role.SUPERADMIN)
  updateUserRole(
    @Param('id') id: string,
    @Body() body: { role: Role },
  ) {
    return this.adminService.updateUserRole(id, body.role);
  }
}