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

    try {
      const secret = process.env.JWT_SECRET || 'cognerix_jwt_secret_2026_secure_key';
      const decoded = jwt.verify(token, secret) as any;

      const ip = request.headers['x-forwarded-for'] || request.socket.remoteAddress || request.ip;
      if (ip && ProfileService.bannedIps && ProfileService.bannedIps.has(ip) && decoded.username !== 'admin') {
        throw new UnauthorizedException('Your IP address has been banned.');
      }

      if (ProfileService.bannedUserIds.has(decoded.userId) || ProfileService.bannedProfileIds.has(decoded.userId)) {
        throw new UnauthorizedException('Your account has been banned.');
      }

      if (ProfileService.deletedProfileIds && ProfileService.deletedProfileIds.has(decoded.userId)) {
        throw new UnauthorizedException('Your account has been deleted.');
      }

      request.user = decoded;
      return true;
    } catch (err: any) {
      throw new UnauthorizedException('Invalid or expired authorization token');
    }
  }
}