import { Injectable } from '@nestjs/common';

interface AttemptRecord {
  count: number;
  firstAttempt: number;
  blockedUntil?: number;
}

@Injectable()
export class LoginAttemptsService {
  private readonly attempts = new Map<string, AttemptRecord>();
  private readonly MAX_ATTEMPTS = 5;
  private readonly WINDOW_MS = 15 * 60 * 1000; // 15 minutes
  private readonly BLOCK_MS = 15 * 60 * 1000;  // block for 15 minutes

  private getKey(email: string, ip: string): string {
    return `${email.toLowerCase()}_${ip}`;
  }

  isBlocked(email: string, ip: string): { blocked: boolean; remainingMs?: number } {
    const key = this.getKey(email, ip);
    const record = this.attempts.get(key);

    if (!record) return { blocked: false };

    const now = Date.now();

    if (record.blockedUntil && now < record.blockedUntil) {
      return { blocked: true, remainingMs: record.blockedUntil - now };
    }

    // Block window expired — clean up
    if (record.blockedUntil && now >= record.blockedUntil) {
      this.attempts.delete(key);
      return { blocked: false };
    }

    return { blocked: false };
  }

  recordFailure(email: string, ip: string): void {
    const key = this.getKey(email, ip);
    const now = Date.now();
    const record = this.attempts.get(key);

    if (!record) {
      this.attempts.set(key, { count: 1, firstAttempt: now });
      return;
    }

    // Reset window if expired
    if (now - record.firstAttempt > this.WINDOW_MS) {
      this.attempts.set(key, { count: 1, firstAttempt: now });
      return;
    }

    record.count += 1;

    if (record.count >= this.MAX_ATTEMPTS) {
      record.blockedUntil = now + this.BLOCK_MS;
    }
  }

  recordSuccess(email: string, ip: string): void {
    // Clear on successful login
    this.attempts.delete(this.getKey(email, ip));
  }
}