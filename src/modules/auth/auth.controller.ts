import {
  Controller,
  Post,
  Body,
  Get,
  Req,
  Res,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ConfigService } from '@nestjs/config';
import { SkipThrottle } from '@nestjs/throttler';
import { LoginAttemptsService } from '../../common/services/login-attempts.service';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private configService: ConfigService,
    private loginAttemptsService: LoginAttemptsService,
  ) {}

  @Post('signup')
  async signUp(
    @Body()
    body: {
      email: string;
      password: string;
      firstname?: string;
      lastname?: string;
    },
  ) {
    return this.authService.signUp(
      body.email,
      body.password,
      body.firstname,
      body.lastname,
    );
  }

  @Post('signin')
  async signIn(@Req() req, @Body() body: { email: string; password: string }) {
    const ip =
      req.headers['x-forwarded-for']?.split(',')[0] || req.ip || 'unknown';
    const email = body.email ?? '';

    console.log('Login attempt — IP:', ip, 'Email:', email); // ← add this

    // 1. Check if blocked
    const { blocked, remainingMs } = this.loginAttemptsService.isBlocked(
      email,
      ip,
    );

    console.log('Blocked:', blocked); // ← and this
    if (blocked) {
      const minutes = Math.ceil((remainingMs ?? 0) / 60000);
      throw new HttpException(
        `Too many failed attempts. Try again in ${minutes} minute(s).`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // 2. Try to validate
    try {
      const user = await this.authService.validateUser(email, body.password);
      this.loginAttemptsService.recordSuccess(email, ip);
      return this.authService.signIn(user);
    } catch {
      // 3. Record failure and rethrow
      this.loginAttemptsService.recordFailure(email, ip);
      throw new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED);
    }
  }

  @Get('google')
  @SkipThrottle()
  @UseGuards(AuthGuard('google'))
  async googleAuth() {}

  @Get('google/callback')
  @SkipThrottle()
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req, @Res() res) {
    try {
      const result = await this.authService.googleLogin(req.user);
      const frontendUrl =
        this.configService.get<string>('FRONTEND_URL') ||
        'http://localhost:3001';
      res.redirect(`${frontendUrl}/auth/callback?token=${result.access_token}`);
    } catch (error) {
      console.error('Google login error:', error);
      const frontendUrl =
        this.configService.get<string>('FRONTEND_URL') ||
        'http://localhost:3001';
      res.redirect(
        //@ts-ignore
        `${frontendUrl}/login?error=authentication_failed&message=${error?.message}`,
      );
    }
  }
}
