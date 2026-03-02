import { ThrottlerGuard, ThrottlerException } from '@nestjs/throttler';
import { Injectable, ExecutionContext } from '@nestjs/common';

@Injectable()
export class LoginThrottleGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    // Track by IP + email combo so one IP can't hammer multiple accounts
    const ip = req.ip || req.connection?.remoteAddress || 'unknown';
    const email = req.body?.email ?? '';
    return `login_${ip}_${email}`;
  }

  protected throwThrottlingException(): Promise<void> {
    throw new ThrottlerException(
      'Too many login attempts. Please wait before trying again.',
    );
  }
}