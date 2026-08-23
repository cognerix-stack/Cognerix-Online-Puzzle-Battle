import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';
import { ProfileService } from '../profile/profile.service';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user; // populated by AuthGuard

    if (!user) {
      throw new ForbiddenException('Access denied. Authentication required.');
    }

    // Strict Admin check: Only the user with email 'admin.cognerix@gmail.com' is allowed
    const registryProfile = ProfileService.getRegistryUser(user.userId);
    const hasAdminEmail = registryProfile?.email?.toLowerCase() === 'admin.cognerix@gmail.com';

    if (hasAdminEmail) {
      return true;
    }

    throw new ForbiddenException('Access denied. Administrator privileges required.');
  }
}
