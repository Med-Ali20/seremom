import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Req,
  Res,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { ConfigService } from '@nestjs/config';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private configService: ConfigService,
  ) {}
  @Post('signup')
  async signUp(
    @Body() body: { email: string; password: string; firstname?: string, lastname?:string },
  ) {
    return this.authService.signUp(body.email, body.password, body.firstname, body.lastname);
  }

  @UseGuards(AuthGuard('local'))
  @Post('signin')
  async signIn(@Req() req) {
    return this.authService.signIn(req.user);
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
    // Initiates Google OAuth flow
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req, @Res() res) {
    try {
      console.log('Google callback - User profile:', req.user);
      const result = await this.authService.googleLogin(req.user);
      console.log('Login successful, token generated');

      const frontendUrl =
        this.configService.get<string>('FRONTEND_URL') ||
        'http://localhost:3001';
      res.redirect(`${frontendUrl}/auth/callback?token=${result.access_token}`);
    } catch (error) {
      console.error('Google login error:', error);
      console.error('Error stack:', error.stack);
      const frontendUrl =
        this.configService.get<string>('FRONTEND_URL') ||
        'http://localhost:3001';
      res.redirect(
        `${frontendUrl}/login?error=authentication_failed&message=${error.message}`,
      );
    }
  }
}
