import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '../auth/enums/role.enum';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async createAdmin(
    email: string,
    password: string,
    firstname?: string,
    lastname?: string,
  ) {
    const hashedPassword = await bcrypt.hash(password, 10);

    return this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstname,
        lastname,
        role: Role.ADMIN,
        provider: 'EMAIL',
      },
      select: {
        id: true,
        email: true,
        firstname: true,
        lastname: true,
        role: true,
        createdAt: true,
      },
    });
  }

  async getAllAdmins() {
    return this.prisma.user.findMany({
      where: {
        role: {
          in: [Role.ADMIN, Role.SUPERADMIN],
        },
      },
      select: {
        id: true,
        email: true,
        firstname: true,
        lastname: true,
        role: true,
        createdAt: true,
      },
    });
  }

  async getAdminById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstname: true,
        lastname: true,
        role: true,
        createdAt: true,
      },
    });
    if (!user) throw new NotFoundException('Admin not found');
    return user;
  }

  async getAllUsers() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstname: true,
        lastname: true,
        role: true,
        provider: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async deleteAdmin(adminId: string, requestingUserId: string) {
    const adminToDelete = await this.prisma.user.findUnique({
      where: { id: adminId },
    });

    if (!adminToDelete) {
      throw new NotFoundException('Admin not found');
    }

    // Prevent deleting superadmin
    if (adminToDelete.role === Role.SUPERADMIN) {
      throw new ForbiddenException('Cannot delete superadmin');
    }

    // Prevent self-deletion
    if (adminId === requestingUserId) {
      throw new ForbiddenException('Cannot delete yourself');
    }

    return this.prisma.user.delete({
      where: { id: adminId },
    });
  }

  async updateAdmin(
    id: string,
    data: {
      firstname?: string;
      lastname?: string;
      email?: string;
      role?: Role;
    },
  ) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Admin not found');
    if (
      user.role === Role.SUPERADMIN &&
      data.role &&
      data.role !== Role.SUPERADMIN
    ) {
      throw new ForbiddenException('Cannot modify superadmin role');
    }

    return this.prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        firstname: true,
        lastname: true,
        role: true,
      },
    });
  }

  async updateUserRole(userId: string, newRole: Role) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Cannot change superadmin role
    if (user.role === Role.SUPERADMIN) {
      throw new ForbiddenException('Cannot modify superadmin role');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: { role: newRole },
      select: {
        id: true,
        email: true,
        firstname: true,
        lastname: true,
        role: true,
      },
    });
  }
}
