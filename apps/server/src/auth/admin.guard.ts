import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user; // populated by AuthGuard

    if (!user) {
      throw new ForbiddenException('Access denied. Authentication required.');
    }

    // Strict Admin check: Only users with verified isAdmin === true claim in JWT
    if (user.isAdmin === true) {
      return true;
    }

    throw new ForbiddenException('Access denied. Administrator privileges required.');
  }
}