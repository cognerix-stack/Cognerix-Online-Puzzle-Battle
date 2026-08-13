import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ProfileService } from '../profile/profile.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    
    // Bypass auth guard for public banned players list check
    if (request.url && request.url.includes('/profile/banned')) {
      return true;
    }

    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid authorization header');
    }

    const token = authHeader.split(' ')[1];
    const userPayload = this.authService.validateToken(token);

    const ip = request.headers['x-forwarded-for'] || request.socket.remoteAddress || request.ip;
    if (ip && ProfileService.bannedIps && ProfileService.bannedIps.has(ip) && userPayload.username !== 'admin') {
      throw new UnauthorizedException('Your IP address has been banned.');
    }

    if (ProfileService.bannedUserIds.has(userPayload.userId) || ProfileService.bannedProfileIds.has(userPayload.userId)) {
      throw new UnauthorizedException('Your account has been banned.');
    }

    if (ProfileService.deletedProfileIds && ProfileService.deletedProfileIds.has(userPayload.userId)) {
      throw new UnauthorizedException('Your account has been deleted.');
    }
    
    // Bind the decoded user properties to the request object
    request.user = userPayload;
    return true;
  }
}
