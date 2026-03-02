// src/common/guards/login-throttle.guard.ts
import { Injectable, ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerException } from '@nestjs/throttler';

@Injectable()
export class LoginThrottleGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    const ip =
      req.headers?.['x-forwarded-for']?.split(',')[0] ||
      req.ip ||
      req.connection?.remoteAddress ||
      'unknown';
    const email = req.body?.email ?? '';
    return `login_${ip}_${email}`;
  }

  protected throwThrottlingException(): Promise<void> {
    throw new ThrottlerException(
      'Too many login attempts. Please wait 15 minutes before trying again.',
    );
  }
}