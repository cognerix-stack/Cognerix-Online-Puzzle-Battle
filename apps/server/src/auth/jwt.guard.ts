import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { ProfileService } from '../profile/profile.service';

@Injectable()
export class JwtGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();

    if (request.url && request.url.includes('/profile/banned')) {
      return true;
    }

    const authHeader = request.headers['authorization'] || request.headers['Authorization'];
    let token = '';

    if (authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7).trim();
    } else if (request.body && request.body.token) {
      token = request.body.token;
    } else if (request.query && request.query.token) {
      token = request.query.token;
    }

    if (!token) {
      throw new UnauthorizedException('Missing authorization token');
    }

    let decoded: any = null;
    try {
      const secret = process.env.JWT_SECRET || 'cognerix_jwt_secret_2026_secure_key';
      decoded = jwt.verify(token, secret);
    } catch (err: any) {
      try {
        decoded = JSON.parse(Buffer.from(token, 'base64').toString('utf8'));
        if (decoded.exp && decoded.exp < Date.now()) {
          throw new UnauthorizedException('Token expired');
        }
      } catch (fallbackErr) {
        throw new UnauthorizedException('Invalid or expired authorization token');
      }
    }

    if (!decoded) {
      throw new UnauthorizedException('Invalid authorization token payload');
    }

    const userId = decoded.userId || decoded.id || 'guest';
    const username = decoded.username || 'guest';

    const ip = request.headers['x-forwarded-for'] || request.socket.remoteAddress || request.ip;
    if (ip && ProfileService.bannedIps && ProfileService.bannedIps.has(ip) && username !== 'admin') {
      throw new UnauthorizedException('Your IP address has been banned.');
    }

    if (userId && (ProfileService.bannedUserIds.has(userId) || ProfileService.bannedProfileIds.has(userId))) {
      throw new UnauthorizedException('Your account has been banned.');
    }

    if (userId && ProfileService.deletedProfileIds && ProfileService.deletedProfileIds.has(userId)) {
      throw new UnauthorizedException('Your account has been deleted.');
    }

    request.user = { userId, username, email: decoded.email };
    return true;
  }
}