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

    // Strict Admin check: Only the user with ID '101698362403' or email 'admin.cognerix@gmail.com' is allowed
    const isMainAdminId = user.userId === '101698362403';

    // Check if the user registry profile has the admin email
    const registryProfile = ProfileService.getRegistryUser(user.userId);
    const hasAdminEmail = registryProfile?.email?.toLowerCase() === 'admin.cognerix@gmail.com';

    if (isMainAdminId || hasAdminEmail) {
      return true;
    }

    throw new ForbiddenException('Access denied. Administrator privileges required.');
  }
}
