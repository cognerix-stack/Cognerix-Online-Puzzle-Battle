import { Controller, Get, Param } from '@nestjs/common';
import { LeaderboardService } from './leaderboard.service';

@Controller('leaderboard')
export class LeaderboardController {
  constructor(private leaderboardService: LeaderboardService) {}

  @Get(':category')
  async getLeaderboard(@Param('category') category: string) {
    return this.leaderboardService.getLeaderboard(category);
  }
}
