import { Injectable } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerException } from '@nestjs/throttler';

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    const ip =
      req.headers['x-forwarded-for'] ||
      req.socket?.remoteAddress ||
      req.ip ||
      'unknown_ip';

    const userTracker =
      req.user?.userId ||
      req.body?.userId ||
      req.body?.email ||
      req.body?.name ||
      'anonymous';

    // Composite key tracks rate limit by both IP address and User ID / Email
    return `${ip}_${userTracker}`;
  }

  protected async throwThrottlingException(context: any, throttlerLimitDetail: any): Promise<void> {
    throw new ThrottlerException('Limit reached. You can submit 1 request every 24 hours.');
  }
}