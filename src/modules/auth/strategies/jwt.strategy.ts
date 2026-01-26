  import { ExtractJwt, Strategy } from 'passport-jwt';
  import { PassportStrategy } from '@nestjs/passport';
  import { Injectable } from '@nestjs/common';
  import { ConfigService } from '@nestjs/config';
  import { PrismaService } from '../../prisma/prisma.service';

  @Injectable()
  export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
      private configService: ConfigService,
      private prisma: PrismaService,
    ) {
      super({
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        ignoreExpiration: false,
        secretOrKey: configService.get<string>('JWT_SECRET'),
      });
    }

    async validate(payload: any) {
      // Fetch user to get their current role
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: { id: true, email: true, role: true },
      });

      if (!user) {
        throw new Error('User not found');
      }

      return { 
        userId: user.id, 
        email: user.email,
        role: user.role, 
      };
    }
  }
