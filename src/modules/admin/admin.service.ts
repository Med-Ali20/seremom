import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '../auth/enums/role.enum';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async createAdmin(email: string, password: string, name?: string) {
    const hashedPassword = await bcrypt.hash(password, 10);

    return this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: Role.ADMIN,
        provider: 'EMAIL',
      },
      select: {
        id: true,
        email: true,
        name: true,
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
        name: true,
        role: true,
        createdAt: true,
      },
    });
  }

  async getAllUsers() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
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
        name: true,
        role: true,
      },
    });
  }
}
