import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { ProfileService } from './profile.service';

@Controller('admin')
@UseGuards(AuthGuard, AdminGuard)
export class AdminController {
  constructor(private readonly profileService: ProfileService) {}

  @Get('chat-history')
  async getChatHistory(@Query('userId') userId: string) {
    return this.profileService.getChatHistoryForUser(userId);
  }
}
