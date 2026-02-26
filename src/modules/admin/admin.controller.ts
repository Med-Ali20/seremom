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
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('admins')
  @Roles(Role.SUPERADMIN)
  createAdmin(
    @Body()
    body: {
      email: string;
      password: string;
      firstname?: string;
      lastname?: string;
    },
  ) {
    return this.adminService.createAdmin(
      body.email,
      body.password,
      body.firstname,
      body.lastname,
    );
  }

  @Get('admins')
  @Roles(Role.SUPERADMIN)
  getAllAdmins() {
    return this.adminService.getAllAdmins();
  }

  @Get('admins/:id')
  @Roles(Role.SUPERADMIN)
  getAdminById(@Param('id') id: string) {
    return this.adminService.getAdminById(id);
  }

  @Get('users')
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  getAllUsers() {
    return this.adminService.getAllUsers();
  }

  @Delete('admins/:id')
  @Roles(Role.SUPERADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteAdmin(
    @Param('id') id: string,
    @CurrentUser() user: { userId: string; email: string; role: Role },
  ) {
    return this.adminService.deleteAdmin(id, user.userId);
  }

  @Patch('users/:id/role')
  @Roles(Role.SUPERADMIN)
  updateUserRole(@Param('id') id: string, @Body() body: { role: Role }) {
    return this.adminService.updateUserRole(id, body.role);
  }

  @Patch('admins/:id')
  @Roles(Role.SUPERADMIN)
  updateAdmin(
    @Param('id') id: string,
    @Body()
    body: {
      firstname?: string;
      lastname?: string;
      email?: string;
      role?: Role;
    },
  ) {
    return this.adminService.updateAdmin(id, body);
  }
}
