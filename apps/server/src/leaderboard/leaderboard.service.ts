import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export const MEMORY_LEADERBOARD: any[] = [
  { userId: 'bot1', username: 'SpeedRunner99', rank: 'LEGEND', score: 980, puzzleType: 'GLOBAL' },
  { userId: 'bot2', username: 'LogicWizard', rank: 'GRANDMASTER', score: 850, puzzleType: 'GLOBAL' },
  { userId: 'bot3', username: 'GridMaster', rank: 'MASTER', score: 710, puzzleType: 'GLOBAL' },
  { userId: 'bot4', username: 'SudokuSlayer', rank: 'DIAMOND', score: 620, puzzleType: 'GLOBAL' },
  { userId: 'bot5', username: 'ViteFast', rank: 'PLATINUM', score: 550, puzzleType: 'GLOBAL' },
  { userId: 'bot1', username: 'SpeedRunner99', rank: 'LEGEND', score: 320, puzzleType: 'SLIDING' },
  { userId: 'bot3', username: 'GridMaster', rank: 'MASTER', score: 540, puzzleType: 'SLIDING' },
  { userId: 'bot2', username: 'LogicWizard', rank: 'GRANDMASTER', score: 180, puzzleType: 'WORD' },
  { userId: 'bot5', username: 'ViteFast', rank: 'PLATINUM', score: 240, puzzleType: 'WORD' },
  { userId: 'bot2', username: 'LogicWizard', rank: 'GRANDMASTER', score: 480, puzzleType: 'EIGHT_BALL_QUIZ' },
  { userId: 'bot4', username: 'SudokuSlayer', rank: 'DIAMOND', score: 350, puzzleType: 'EIGHT_BALL_QUIZ' },
  { userId: 'bot3', username: 'GridMaster', rank: 'MASTER', score: 620, puzzleType: 'BLOCK_BLUSTER' },
  { userId: 'bot1', username: 'SpeedRunner99', rank: 'LEGEND', score: 580, puzzleType: 'WORD_SEARCH' },
  { userId: 'bot1', username: 'SpeedRunner99', rank: 'LEGEND', score: 1450, puzzleType: 'TOWER_BLOXX' },
  { userId: 'bot2', username: 'LogicWizard', rank: 'GRANDMASTER', score: 1600, puzzleType: 'JIGSAW' }
];

@Injectable()
export class LeaderboardService {
  constructor(private prisma: PrismaService) {}

  static addInMemoryEntry(entry: { userId: string; username: string; rank: string; score: number; puzzleType: string; nameColor?: string; badges?: string; avatar?: string; frame?: string }) {
    const existingIdx = MEMORY_LEADERBOARD.findIndex(
      e => e.userId === entry.userId && e.puzzleType === entry.puzzleType
    );
    if (existingIdx !== -1) {
      if (entry.puzzleType === 'GLOBAL') {
        MEMORY_LEADERBOARD[existingIdx].score = entry.score;
      } else {
        MEMORY_LEADERBOARD[existingIdx].score += entry.score;
      }
      MEMORY_LEADERBOARD[existingIdx].rank = entry.rank;
      MEMORY_LEADERBOARD[existingIdx].username = entry.username;
      if (entry.nameColor !== undefined) MEMORY_LEADERBOARD[existingIdx].nameColor = entry.nameColor;
      if (entry.badges !== undefined) MEMORY_LEADERBOARD[existingIdx].badges = entry.badges;
      if (entry.avatar !== undefined) MEMORY_LEADERBOARD[existingIdx].avatar = entry.avatar;
      if (entry.frame !== undefined) MEMORY_LEADERBOARD[existingIdx].frame = entry.frame;
    } else {
      MEMORY_LEADERBOARD.push(entry);
    }
  }

  // Get top 50 ratings for a specific puzzle or global rank
  async getLeaderboard(puzzleType: string) {
    try {
      const entries = await this.prisma.leaderboardEntry.findMany({
        where: {
          puzzleType: puzzleType.toUpperCase(),
        },
        orderBy: {
          score: 'desc',
        },
        take: 50,
      });

      // Enrich database entries with user profile nameColor and badges
      const userIds = entries.map(e => e.userId);
      const profiles = await this.prisma.profile.findMany({
        where: {
          userId: { in: userIds }
        }
      });
      const profileMap = new Map(profiles.map(p => [p.userId, p]));
      return entries.map(e => {
        const p = profileMap.get(e.userId);
        return {
          ...e,
          nameColor: p?.nameColor || undefined,
          badges: p?.badges ? p.badges.join(',') : '',
          avatar: p?.avatar || undefined,
          frame: p?.frame || undefined
        };
      });
    } catch (e) {
      // Offline fallback: return in-memory scores sorted descending
      return MEMORY_LEADERBOARD.filter(
        e => e.puzzleType === puzzleType.toUpperCase()
      ).sort((a, b) => b.score - a.score);
    }
  }
}
