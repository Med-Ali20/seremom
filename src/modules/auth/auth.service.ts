import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  OnModuleInit,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from './enums/role.enum';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService implements OnModuleInit {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async onModuleInit() {
    await this.createSuperAdminFromEnv();
  }

  private async createSuperAdminFromEnv() {
    const email = this.configService.get<string>('SUPERADMIN_EMAIL');
    const password = this.configService.get<string>('SUPERADMIN_PASSWORD');

    if (!email || !password) {
      console.warn('⚠️  SUPERADMIN_EMAIL and SUPERADMIN_PASSWORD not set in .env');
      return;
    }

    const existing = await this.prisma.user.findUnique({ where: { email } });

    if (!existing) {
      const hashedPassword = await bcrypt.hash(password, 10);
      await this.prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          firstname: 'Sabina',
          role: Role.SUPERADMIN,
          provider: 'EMAIL',
        },
      });
      console.log('✅ Superadmin created:', email);
    }
  }

  async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user || user.provider !== 'EMAIL' || !user.password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const { password: _, ...result } = user;
    return result;
  }

  async signUp(
    email: string,
    password: string,
    firstname?: string,
    lastname?: string,
  ) {
    const existingUser = await this.prisma.user.findUnique({ where: { email } });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstname,
        lastname,
        provider: 'EMAIL',
        role: Role.USER,
      },
    });

    const { password: _, ...result } = user;
    return this.generateToken(result);
  }

  async signIn(user: any) {
    return this.generateToken(user);
  }

  async googleLogin(profile: any) {
    try {
      const { id, email, displayName } = profile;

      if (!email) throw new Error('No email provided by Google');

      let user = await this.prisma.user.findUnique({ where: { email } });

      if (user) {
        if (!user.googleId) {
          user = await this.prisma.user.update({
            where: { id: user.id },
            data: { googleId: id, provider: 'GOOGLE' },
          });
        }
      } else {
        user = await this.prisma.user.create({
          data: {
            email,
            googleId: id,
            firstname: displayName.split(' ')[0],
            lastname: displayName.split(' ')[1],
            provider: 'GOOGLE',
            role: Role.USER,
          },
        });
      }

      const { password: _, ...result } = user;
      return this.generateToken(result);
    } catch (error) {
      console.error('Error in googleLogin:', error);
      throw error;
    }
  }

  private generateToken(user: any) {
    const payload = {
      email: user.email,
      sub: user.id,
      role: user.role,
      completedOnboarding: user.completedOnboarding ?? false, // ← middleware reads this
    };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        firstname: user.firstname,
        lastname: user.lastname,
        role: user.role,
        completedOnboarding: user.completedOnboarding, // ← added
      },
    };
  }
}