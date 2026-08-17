import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RankName, PuzzleType } from '@puzzle-verse/shared';
import * as fs from 'fs';
import * as path from 'path';
import * as nodemailer from 'nodemailer';

@Injectable()
export class ProfileService {
  constructor(private prisma: PrismaService) {}

  async getProfile(userId: string) {
    try {
      const profile = await this.prisma.profile.findUnique({
        where: { userId },
      });
      if (profile) {
        const mem = ProfileService.userRegistry.get(userId);
        if (mem) {
          mem.lastSeen = Date.now();
        } else {
          ProfileService.setRegistryUser(userId, {
            ...profile,
            lastSeen: Date.now()
          });
        }
        return profile;
      }
    } catch (e: any) {
      console.warn(`[ProfileService] Database lookup failed for getProfile, falling back to memory:`, e.message);
    }
    const mem = ProfileService.userRegistry.get(userId);
    if (mem) {
      mem.lastSeen = Date.now();
      return mem;
    }
    throw new NotFoundException('Profile not found');
  }

  async updateStatus(userId: string, status: string) {
    return this.prisma.profile.update({
      where: { userId },
      data: { status: status.slice(0, 100) },
    });
  }

  async updateAvatarAndFrame(userId: string, avatar: string, frame: string) {
    try {
      return await this.prisma.profile.update({
        where: { userId },
        data: { avatar, frame },
      });
    } catch (e) {
      // Database offline/fallback mode: record directly in MEMORY_LEADERBOARD
      const { MEMORY_LEADERBOARD } = require('../leaderboard/leaderboard.service');
      let found = false;
      MEMORY_LEADERBOARD.forEach((entry: any) => {
        if (entry.userId === userId) {
          entry.avatar = avatar;
          entry.frame = frame;
          found = true;
        }
      });
      // If the user doesn't have any entries yet, create a placeholder GLOBAL entry so they exist in memory
      if (!found) {
        MEMORY_LEADERBOARD.push({
          userId,
          username: `Player_${userId.substring(userId.length - 4)}`,
          rank: 'BRONZE',
          score: 0,
          puzzleType: 'GLOBAL',
          avatar,
          frame
        });
      }
      console.log(`[Offline Fallback] Updated in-memory avatar and frame for ${userId}: avatar=${avatar}, frame=${frame}`);
      return {
        userId,
        avatar,
        frame,
        username: `Player_${userId.substring(userId.length - 4)}`,
        level: 1,
        xp: 0,
        coins: 100,
        gems: 10,
        rank: 'BRONZE',
        badges: [],
        inventory: [],
      } as any;
    }
  }

  // Calculate Rank based on level
  private getRankFromLevel(level: number): RankName {
    if (level >= 30) return RankName.LEGEND;
    if (level >= 25) return RankName.GRANDMASTER;
    if (level >= 20) return RankName.MASTER;
    if (level >= 15) return RankName.DIAMOND;
    if (level >= 10) return RankName.PLATINUM;
    if (level >= 7) return RankName.GOLD;
    if (level >= 4) return RankName.SILVER;
    return RankName.BRONZE;
  }

  // Record a Win and grant rewards
  async recordGameWin(
    userId: string, 
    puzzleType: PuzzleType, 
    timeInSec: number, 
    score: number, 
    username?: string, 
    nameColor?: string, 
    badges?: string, 
    clientRank?: string,
    avatar?: string,
    frame?: string
  ) {
    try {
      const profile = await this.prisma.profile.findUnique({
        where: { userId },
      });
      if (!profile) {
        throw new NotFoundException('Profile not found');
      }

      const xpReward = Math.min(100, Math.max(10, Math.floor(score / 5)));
      const coinReward = Math.min(150, Math.max(10, Math.floor(score / 3)));

      const nextXP = profile.xp + xpReward;
      let nextLevel = profile.level;
      let nextCoins = profile.coins + coinReward;
      let nextGems = profile.gems;

      const xpRequired = nextLevel * 100;
      let leveledUp = false;
      
      if (nextXP >= xpRequired) {
        nextLevel += 1;
        nextCoins += nextLevel * 50; // Level up coins
        nextGems += 2;              // Level up gems
        leveledUp = true;
      }

      const nextRank = this.getRankFromLevel(nextLevel);

      const updateData: any = {
        level: nextLevel,
        xp: leveledUp ? nextXP - xpRequired : nextXP,
        coins: nextCoins,
        gems: nextGems,
        rank: nextRank as any, // Cast to prisma enum
      };

      if (avatar !== undefined) updateData.avatar = avatar;
      if (frame !== undefined) updateData.frame = frame;

      const updatedProfile = await this.prisma.profile.update({
        where: { userId },
        data: updateData,
      });

      // Record high score in LeaderboardEntry
      await this.prisma.leaderboardEntry.upsert({
        where: {
          userId_puzzleType: {
            userId,
            puzzleType: puzzleType.toString(),
          },
        },
        update: {
          score: {
            increment: score,
          },
          rank: nextRank as any,
          username: username || profile.username
        },
        create: {
          userId,
          username: username || profile.username,
          rank: nextRank as any,
          score,
          puzzleType: puzzleType.toString(),
        },
      });

      // Recalculate and update GLOBAL entry in database
      const userEntries = await this.prisma.leaderboardEntry.findMany({
        where: {
          userId,
          NOT: {
            puzzleType: 'GLOBAL'
          }
        }
      });

      // Sum scores of all specific puzzle categories
      const globalScore = userEntries.reduce((sum: number, entry: any) => sum + entry.score, 0);

      await this.prisma.leaderboardEntry.upsert({
        where: {
          userId_puzzleType: {
            userId,
            puzzleType: 'GLOBAL'
          }
        },
        update: {
          score: globalScore,
          rank: nextRank as any,
          username: username || profile.username
        },
        create: {
          userId,
          username: username || profile.username,
          rank: nextRank as any,
          score: globalScore,
          puzzleType: 'GLOBAL'
        }
      });

      return updatedProfile;
    } catch (e) {
      // Database offline/fallback mode: record directly in shared MEMORY_LEADERBOARD
      const { LeaderboardService, MEMORY_LEADERBOARD } = require('../leaderboard/leaderboard.service');
      const resolvedName = username || (userId.startsWith('10') || userId.startsWith('20') || userId.startsWith('90') || userId.startsWith('user_') || userId.startsWith('google_') || userId.startsWith('guest_')
        ? `Player_${userId.substring(userId.length - 4)}` 
        : userId);
      
      LeaderboardService.addInMemoryEntry({
        userId,
        username: resolvedName,
        rank: clientRank || 'BRONZE',
        score,
        puzzleType: puzzleType.toString().toUpperCase(),
        nameColor,
        badges,
        avatar,
        frame
      });

      // Recalculate/update global score in memory by summing all non-GLOBAL categories
      const userCategoryEntries = MEMORY_LEADERBOARD.filter(
        (entry: any) => entry.userId === userId && entry.puzzleType !== 'GLOBAL'
      );
      const globalScore = userCategoryEntries.reduce((sum: number, entry: any) => sum + entry.score, 0);

      LeaderboardService.addInMemoryEntry({
        userId,
        username: resolvedName,
        rank: clientRank || 'BRONZE',
        score: globalScore,
        puzzleType: 'GLOBAL',
        nameColor,
        badges,
        avatar,
        frame
      });

      console.log(`[Offline Fallback] Synchronized in-memory leaderboard for player: ${resolvedName}, score: ${score}`);
      throw e;
    }
  }

  // Buy a store customizer item
  async buyStoreItem(userId: string, itemId: string, costCoins: number, costGems: number) {
    const profile = await this.getProfile(userId);

    if (profile.inventory.includes(itemId)) {
      throw new Error('You already own this item');
    }

    if (profile.coins < costCoins) {
      throw new Error('Insufficient coins');
    }

    if (profile.gems < costGems) {
      throw new Error('Insufficient gems');
    }

    return this.prisma.profile.update({
      where: { userId },
      data: {
        coins: profile.coins - costCoins,
        gems: profile.gems - costGems,
        inventory: {
          set: [...profile.inventory, itemId],
        },
      },
    });
  }

  // Equip a cosmetic customizer item
  async equipCosmetic(userId: string, itemId: string, type: 'NAME_COLOR' | 'BADGE' | 'LOBBY_ANIMATION', value: string) {
    const profile = await this.getProfile(userId);

    if (!profile.inventory.includes(itemId)) {
      throw new Error('Item not purchased yet');
    }

    const updateData: any = {};
    if (type === 'NAME_COLOR') {
      updateData.nameColor = value;
    } else if (type === 'LOBBY_ANIMATION') {
      updateData.lobbyEntranceAnimation = value;
    } else if (type === 'BADGE') {
      const hasBadge = profile.badges.includes(value);
      if (hasBadge) {
        updateData.badges = {
          set: profile.badges.filter((b: string) => b !== value),
        };
      } else {
        updateData.badges = {
          set: [...profile.badges.slice(-2), value], // Max 3 badges
        };
      }
    }

    return this.prisma.profile.update({
      where: { userId },
      data: updateData,
    });
  }

  public static gameHistory: any[] = [];

  private static getPersistencePath(fileName: string): string {
    const parentRootPath = path.join(process.cwd(), '..', '..', fileName);
    if (fs.existsSync(parentRootPath)) {
      return parentRootPath;
    }
    const cwdPath = path.join(process.cwd(), fileName);
    if (fs.existsSync(cwdPath)) {
      return cwdPath;
    }
    const relativeToSrc = path.join(__dirname, '..', '..', '..', '..', fileName);
    if (fs.existsSync(relativeToSrc)) {
      return relativeToSrc;
    }
    if (process.cwd().includes('apps' + path.sep + 'server') || process.cwd().endsWith('apps/server')) {
      return path.join(process.cwd(), '..', '..', fileName);
    }
    return cwdPath;
  }

  static {
    try {
      const historyPath = ProfileService.getPersistencePath('game_history.json');
      if (fs.existsSync(historyPath)) {
        const fileContent = fs.readFileSync(historyPath, 'utf-8');
        const data = JSON.parse(fileContent);
        if (Array.isArray(data)) {
          ProfileService.gameHistory = data;
          console.log(`[GameHistory] Restored ${data.length} match records from game_history.json`);
        }
      }
    } catch (e) {
      console.error('[GameHistory] Failed to load game_history.json:', e);
    }
  }

  static saveHistoryToDisk() {
    try {
      const historyPath = ProfileService.getPersistencePath('game_history.json');
      fs.writeFileSync(historyPath, JSON.stringify(ProfileService.gameHistory, null, 2), 'utf-8');
    } catch (e) {
      console.error('[GameHistory] Failed to write game_history.json:', e);
    }
  }

  static recordHistory(entry: any) {
    ProfileService.gameHistory.push(entry);
    ProfileService.saveHistoryToDisk();
  }

  async getGameHistory(userId: string) {
    return ProfileService.gameHistory.filter(entry =>
      entry.players && entry.players.some((p: any) => p.id === userId)
    );
  }

  private static userRegistry = new Map<string, any>();
  private static friendships = new Map<string, Set<string>>();
  private static popupAnnouncements: any[] = [];
  private static friendRequests = new Map<string, Array<{ senderId: string; senderUsername: string }>>();

  static {
    try {
      const filePath = ProfileService.getPersistencePath('registered_profiles.json');
      if (fs.existsSync(filePath)) {
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const data = JSON.parse(fileContent);
        if (Array.isArray(data)) {
          data.forEach(p => {
            ProfileService.userRegistry.set(p.id, p);
          });
          console.log(`[ProfileRegistry] Restored ${data.length} registered profiles from registered_profiles.json`);
        }
      }
    } catch (e) {
      console.error('[ProfileRegistry] Failed to load registered_profiles.json:', e);
    }

    try {
      const filePath = ProfileService.getPersistencePath('popup_announcements.json');
      if (fs.existsSync(filePath)) {
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const data = JSON.parse(fileContent);
        if (Array.isArray(data)) {
          ProfileService.popupAnnouncements = data;
          console.log(`[PopupAnnouncements] Restored ${data.length} popup announcements from popup_announcements.json`);
        }
      }
    } catch (e) {
      console.error('[PopupAnnouncements] Failed to load popup_announcements.json:', e);
    }
  }

  static saveRegistryToDisk() {
    try {
      const filePath = ProfileService.getPersistencePath('registered_profiles.json');
      const arr = Array.from(ProfileService.userRegistry.values());
      fs.writeFileSync(filePath, JSON.stringify(arr, null, 2), 'utf-8');
    } catch (e) {
      console.error('[ProfileRegistry] Failed to save registered_profiles.json:', e);
    }
  }

  static setRegistryUser(userId: string, profile: any) {
    const existing = ProfileService.userRegistry.get(userId);
    let sessionStart = Date.now();
    if (existing) {
      // If user was active within the last 30 seconds, keep their current sessionStart
      if (existing.lastSeen && (Date.now() - existing.lastSeen < 30000)) {
        sessionStart = existing.sessionStart || existing.lastSeen || Date.now();
      }
    }
    const updated = {
      ...profile,
      sessionStart,
      lastSeen: Date.now()
    };
    ProfileService.userRegistry.set(userId, updated);
    ProfileService.saveRegistryToDisk();
  }

  static deleteRegistryUser(userId: string) {
    ProfileService.userRegistry.delete(userId);
    ProfileService.saveRegistryToDisk();
  }

  static getRegistryUser(userId: string): any | undefined {
    return ProfileService.userRegistry.get(userId);
  }

  async syncProfile(profile: any) {
    if (profile && profile.id) {
      if (ProfileService.deletedProfileIds.has(profile.id)) {
        console.log(`[ProfileRegistry] Sync rejected for deleted user ID: ${profile.id}`);
        return { success: false, deleted: true };
      }

      // Check if profile exists in userRegistry
      let exists = ProfileService.userRegistry.has(profile.id);

      // Guests are transient and generated from scratch on each session, so they bypass lookup validation
      if (!exists && (profile.id.startsWith('20') || profile.id.startsWith('guest_'))) {
        exists = true;
      }

      // If not in registry, check the database (if connected)
      if (!exists) {
        try {
          const dbProfile = await this.prisma.profile.findUnique({
            where: { userId: profile.id },
          });
          if (dbProfile) {
            exists = true;
            // Restore database profile into memory registry
            ProfileService.setRegistryUser(profile.id, {
              id: dbProfile.userId,
              username: dbProfile.username,
              avatar: dbProfile.avatar || '👤',
              frame: dbProfile.frame || 'none',
              rank: dbProfile.rank || 'BRONZE',
              nameColor: dbProfile.nameColor || '',
              coins: dbProfile.coins,
              gems: dbProfile.gems,
              level: dbProfile.level,
              xp: dbProfile.xp,
              score: 0,
              status: dbProfile.status || 'online',
              lastSeen: Date.now(),
              email: profile.email || '',
              ipAddress: profile.ipAddress || '',
              statistics: profile.statistics || null
            });
          }
        } catch (e: any) {
          console.warn(`[ProfileRegistry] Database lookup failed during sync check for ${profile.id}:`, e.message);
          // Database offline fallback: restore active Google/Guest sessions
          if (profile.id.startsWith('10') || profile.id.startsWith('20') || profile.id.startsWith('google_') || profile.id.startsWith('guest_')) {
            exists = true;
            console.log(`[ProfileRegistry] Database offline fallback: restoring active session registration for ID: ${profile.id}`);
          }
        }
      }

      if (!exists) {
        console.warn(`[ProfileRegistry] Sync rejected: profile ${profile.id} has not been loaded/created first.`);
        return { success: false, notLoaded: true };
      }

      const existing = ProfileService.userRegistry.get(profile.id);

      ProfileService.setRegistryUser(profile.id, {
        id: profile.id,
        username: profile.username,
        avatar: profile.avatar || '👤',
        frame: profile.frame || 'none',
        rank: profile.rank || 'BRONZE',
        nameColor: profile.nameColor || '',
        coins: profile.coins !== undefined ? profile.coins : 0,
        gems: profile.gems !== undefined ? profile.gems : 0,
        level: profile.level !== undefined ? profile.level : 1,
        xp: profile.xp !== undefined ? profile.xp : 0,
        score: profile.score !== undefined ? profile.score : 0,
        status: profile.status !== undefined ? profile.status : (existing?.status || 'Ready to solve the universe.'),
        lobbyEntranceAnimation: profile.lobbyEntranceAnimation || existing?.lobbyEntranceAnimation || '',
        badges: profile.badges || existing?.badges || [],
        inventory: profile.inventory || existing?.inventory || [],
        lastSeen: Date.now(),
        email: profile.email || '',
        ipAddress: profile.ipAddress || '',
        statistics: profile.statistics || null,
        region: existing?.region || 'Delhi',
        country: existing?.country || 'India'
      });

      // Update database if connected
      try {
        await this.prisma.profile.update({
          where: { userId: profile.id },
          data: {
            username: profile.username,
            avatar: profile.avatar,
            frame: profile.frame,
            rank: profile.rank,
            nameColor: profile.nameColor || '',
            coins: profile.coins !== undefined ? profile.coins : undefined,
            gems: profile.gems !== undefined ? profile.gems : undefined,
            level: profile.level !== undefined ? profile.level : undefined,
            xp: profile.xp !== undefined ? profile.xp : undefined,
            status: profile.status !== undefined ? profile.status : undefined,
            lobbyEntranceAnimation: profile.lobbyEntranceAnimation || '',
            badges: profile.badges ? { set: profile.badges } : undefined,
            inventory: profile.inventory ? { set: profile.inventory } : undefined
          }
        });
      } catch (dbErr: any) {
        // Fallback silently if database is unreachable/offline
      }

      // Resolve geo-ip in background
      ProfileService.resolveGeoIp(profile.ipAddress || '').then((geo) => {
        const entry = ProfileService.userRegistry.get(profile.id);
        if (entry) {
          entry.region = geo.region;
          entry.country = geo.country;
          ProfileService.saveRegistryToDisk();
        }
      }).catch(() => {});

      console.log(`[ProfileRegistry] Registered/Updated user in memory with location: ${profile.username} (${profile.id})`);
    }
    return { success: true, profile: profile && profile.id ? ProfileService.userRegistry.get(profile.id) : null };
  }

  static async resolveGeoIp(ipAddress: string): Promise<{ region: string; country: string }> {
    if (!ipAddress || ipAddress === '::1' || ipAddress === '127.0.0.1' || ipAddress.includes('127.0.0.1') || ipAddress.includes('::ffff:127.0.0.1')) {
      return { region: 'Delhi', country: 'India' };
    }
    try {
      const res = await fetch(`http://ip-api.com/json/${ipAddress}`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.status === 'success') {
          return {
            region: data.regionName || 'Delhi',
            country: data.country || 'India'
          };
        }
      }
    } catch (e: any) {
      console.warn(`[GeoIp] Failed to resolve IP ${ipAddress}:`, e.message);
    }
    return { region: 'Delhi', country: 'India' };
  }

  async loadOrCreateProfile(userId: string, username: string, email: string) {
    if (!userId) {
      throw new BadRequestException('userId is required');
    }

    // 1. Try database lookup first
    try {
      const dbProfile = await this.prisma.profile.findUnique({
        where: { userId },
      });
      if (dbProfile) {
        console.log(`[ProfileService] Loaded existing profile from database for: ${dbProfile.username} (${userId})`);
        
        const restored = {
          id: dbProfile.userId,
          username: dbProfile.username,
          avatar: dbProfile.avatar || '👤',
          frame: dbProfile.frame || 'none',
          rank: dbProfile.rank || 'BRONZE',
          nameColor: dbProfile.nameColor || '',
          coins: dbProfile.coins,
          gems: dbProfile.gems,
          level: dbProfile.level,
          xp: dbProfile.xp,
          badges: dbProfile.badges || [],
          inventory: dbProfile.inventory || [],
          status: dbProfile.status || 'Ready to solve the universe.',
          lobbyEntranceAnimation: dbProfile.lobbyEntranceAnimation || '',
          email: email || '',
          statistics: ProfileService.userRegistry.get(userId)?.statistics || {
            gamesPlayed: 0,
            gamesWon: 0,
            totalSolveTime: 0,
            highestStreak: 0,
            puzzleSpecificStats: {}
          }
        };

        // Populate registry
        ProfileService.setRegistryUser(userId, {
          ...restored,
          status: 'online',
          lastSeen: Date.now(),
          ipAddress: '',
          score: 0
        });

        return { exists: true, profile: restored };
      }
    } catch (e: any) {
      console.warn(`[ProfileService] Database lookup failed in loadOrCreateProfile, falling back to memory:`, e.message);
    }

    // 2. Try memory registry lookup
    const memProfile = ProfileService.userRegistry.get(userId);
    if (memProfile) {
      console.log(`[ProfileService] Loaded existing profile from memory registry for: ${memProfile.username} (${userId})`);
      return { exists: true, profile: memProfile };
    }

    // 3. Create default profile
    const defaultProfile = {
      id: userId,
      username,
      email,
      level: 1,
      xp: 0,
      coins: 100,
      gems: 10,
      rank: RankName.BRONZE,
      badges: [],
      inventory: [],
      avatar: '👤',
      frame: 'none',
      status: 'Ready to solve the universe.',
      lobbyEntranceAnimation: '',
      statistics: {
        gamesPlayed: 0,
        gamesWon: 0,
        totalSolveTime: 0,
        highestStreak: 0,
        puzzleSpecificStats: {}
      }
    };

    // Save to database
    try {
      const dbUser = await this.prisma.user.upsert({
        where: { email },
        update: {},
        create: {
          id: userId,
          email
        }
      });

      const dbProfile = await this.prisma.profile.create({
        data: {
          userId: dbUser.id,
          username,
          level: 1,
          xp: 0,
          coins: 100,
          gems: 10,
          rank: RankName.BRONZE,
          badges: [],
          inventory: [],
          avatar: '👤',
          frame: 'none',
          status: 'Ready to solve the universe.',
          lobbyEntranceAnimation: ''
        }
      });
      
      console.log(`[ProfileService] Created new persistent profile in database for: ${username} (${userId})`);
      
      const restored = {
        id: dbProfile.userId,
        username: dbProfile.username,
        avatar: dbProfile.avatar || '👤',
        frame: dbProfile.frame || 'none',
        rank: dbProfile.rank || 'BRONZE',
        nameColor: dbProfile.nameColor || '',
        coins: dbProfile.coins,
        gems: dbProfile.gems,
        level: dbProfile.level,
        xp: dbProfile.xp,
        badges: dbProfile.badges || [],
        inventory: dbProfile.inventory || [],
        status: dbProfile.status || 'Ready to solve the universe.',
        lobbyEntranceAnimation: dbProfile.lobbyEntranceAnimation || '',
        email,
        statistics: defaultProfile.statistics
      };

      ProfileService.setRegistryUser(userId, {
        ...restored,
        status: 'online',
        lastSeen: Date.now(),
        ipAddress: '',
        score: 0
      });

      return { exists: false, profile: restored };
    } catch (e: any) {
      console.warn(`[ProfileService] Database creation skipped/failed, falling back to memory:`, e.message);
    }

    // Save to memory only
    ProfileService.setRegistryUser(userId, {
      ...defaultProfile,
      status: 'online',
      lastSeen: Date.now(),
      ipAddress: '',
      score: 0
    });
    console.log(`[ProfileService] Created new in-memory profile for: ${username} (${userId})`);
    return { exists: false, profile: defaultProfile };
  }

  async deleteProfile(userId: string) {
    // 1. Remove from in-memory user registry
    ProfileService.deleteRegistryUser(userId);

    // 2. Remove friendships
    ProfileService.friendships.delete(userId);
    ProfileService.friendships.forEach((friendsSet) => {
      friendsSet.delete(userId);
    });

    // 3. Remove from MEMORY_LEADERBOARD
    try {
      const { MEMORY_LEADERBOARD } = require('../leaderboard/leaderboard.service');
      const index = MEMORY_LEADERBOARD.findIndex((entry: any) => entry.userId === userId);
      if (index !== -1) {
        MEMORY_LEADERBOARD.splice(index, 1);
        console.log(`[ProfileRegistry] Removed ${userId} from MEMORY_LEADERBOARD`);
      }
    } catch (e) {
      console.error('[ProfileRegistry] MEMORY_LEADERBOARD cleanup failed:', e);
    }

    // 4. Add to deleted profile IDs persistence
    ProfileService.deletedProfileIds.add(userId);
    ProfileService.saveDeletedPlayers();

    // 5. Remove from Prisma Database (including LeaderboardEntry)
    try {
      await this.prisma.leaderboardEntry.deleteMany({ where: { userId } });
      await this.prisma.profile.deleteMany({ where: { userId } });
      await this.prisma.user.deleteMany({ where: { id: userId } });
      console.log(`[ProfileRegistry] Deleted database profile/user records for ${userId}`);
    } catch (e: any) {
      console.warn('[ProfileRegistry] Database clean-up failed/skipped:', e.message);
    }

    return { success: true };
  }

  async getAllUsers() {
    return Array.from(ProfileService.userRegistry.values()).map(user => {
      const friendsSet = ProfileService.friendships.get(user.id);
      return {
        ...user,
        friendsCount: friendsSet ? friendsSet.size : 0
      };
    });
  }

  async getFriends(userId: string) {
    const friends = new Array<any>();
    const userFriendIds = ProfileService.friendships.get(userId);
    if (userFriendIds) {
      userFriendIds.forEach((friendId) => {
        const friendProfile = ProfileService.userRegistry.get(friendId);
        if (friendProfile) {
          const isOnline = friendProfile.lastSeen && (Date.now() - friendProfile.lastSeen < 8000);
          friends.push({
            ...friendProfile,
            status: isOnline ? 'online' : 'offline'
          });
        } else {
          // Placeholder fallback if not synced yet
          friends.push({
            id: friendId,
            username: `Player_${friendId.substring(friendId.length - 4)}`,
            avatar: '👤',
            frame: 'none',
            rank: 'BRONZE',
            status: 'offline'
          });
        }
      });
    }
    return friends;
  }

  async findProfileByQuery(query: string): Promise<any> {
    const q = query.trim().toLowerCase();
    if (!q) return null;

    // 1. Search in-memory registry first
    let foundUser: any = null;
    ProfileService.userRegistry.forEach((u, id) => {
      if (
        u.username.toLowerCase() === q ||
        id.toLowerCase() === q ||
        id.toLowerCase().includes(q)
      ) {
        foundUser = u;
      }
    });

    if (foundUser) return foundUser;

    // 2. Search Prisma database if online
    try {
      const dbProfile = await this.prisma.profile.findFirst({
        where: {
          OR: [
            { username: { equals: query, mode: 'insensitive' } },
            { userId: { equals: query, mode: 'insensitive' } },
            { userId: { contains: query, mode: 'insensitive' } }
          ]
        }
      });
      if (dbProfile) {
        const formatted = {
          id: dbProfile.userId,
          username: dbProfile.username,
          avatar: dbProfile.avatar || '👤',
          frame: dbProfile.frame || 'none',
          rank: dbProfile.rank || 'BRONZE',
          nameColor: dbProfile.nameColor || '',
          status: dbProfile.status || 'online'
        };
        ProfileService.setRegistryUser(dbProfile.userId, formatted);
        return formatted;
      }
    } catch (e: any) {
      console.warn('[Friends] Prisma lookup failed (database offline):', e.message);
    }

    // 3. Fallback to MEMORY_LEADERBOARD
    try {
      const { MEMORY_LEADERBOARD } = require('../leaderboard/leaderboard.service');
      const match = MEMORY_LEADERBOARD.find((entry: any) => 
        entry.username.toLowerCase() === q || 
        entry.userId.toLowerCase() === q ||
        entry.userId.toLowerCase().includes(q)
      );
      if (match) {
        const formatted = {
          id: match.userId,
          username: match.username,
          avatar: match.avatar || '👤',
          frame: match.frame || 'none',
          rank: match.rank || 'BRONZE',
          nameColor: '',
          status: 'online'
        };
        ProfileService.setRegistryUser(match.userId, formatted);
        return formatted;
      }
    } catch (e) {
      console.error('[Friends] MEMORY_LEADERBOARD lookup failed:', e);
    }

    return null;
  }

  async addFriend(userId: string, friendUsername: string) {
    const friendProfile = await this.findProfileByQuery(friendUsername);
    if (!friendProfile) {
      throw new NotFoundException('Friend profile not found. Please check their username or Unique ID.');
    }

    const friendId = friendProfile.id;

    // Mutually add to friendships
    if (!ProfileService.friendships.has(userId)) {
      ProfileService.friendships.set(userId, new Set());
    }
    ProfileService.friendships.get(userId)?.add(friendId);

    if (!ProfileService.friendships.has(friendId)) {
      ProfileService.friendships.set(friendId, new Set());
    }
    ProfileService.friendships.get(friendId)?.add(userId);

    console.log(`[Friends] Mutual friendship established between ${userId} and ${friendId}`);
    return this.getFriends(userId);
  }

  async removeFriend(userId: string, friendId: string) {
    if (ProfileService.friendships.has(userId)) {
      ProfileService.friendships.get(userId)?.delete(friendId);
    }
    if (ProfileService.friendships.has(friendId)) {
      ProfileService.friendships.get(friendId)?.delete(userId);
    }
    console.log(`[Friends] Removed friendship mutually between ${userId} and ${friendId}`);
    return this.getFriends(userId);
  }

  async sendFriendRequest(userId: string, friendUsername?: string, friendId?: string) {
    let friendProfile: any = null;
    if (friendId) {
      friendProfile = ProfileService.userRegistry.get(friendId);
    }
    if (!friendProfile && friendUsername) {
      friendProfile = await this.findProfileByQuery(friendUsername);
    }

    if (!friendProfile) {
      throw new NotFoundException('Friend profile not found. Please check their username or Unique ID.');
    }

    const targetId = friendProfile.id;
    if (userId === targetId) {
      throw new BadRequestException('You cannot send a friend request to yourself.');
    }

    // Check if already friends
    if (ProfileService.friendships.get(userId)?.has(targetId)) {
      throw new BadRequestException('You are already friends with this player.');
    }

    // Check if request is already pending
    const existing = ProfileService.friendRequests.get(targetId) || [];
    if (existing.some(r => r.senderId === userId)) {
      throw new BadRequestException('Friend request already sent and pending.');
    }

    const senderProfile = ProfileService.userRegistry.get(userId);
    const senderUsername = senderProfile ? senderProfile.username : 'Someone';

    if (!ProfileService.friendRequests.has(targetId)) {
      ProfileService.friendRequests.set(targetId, []);
    }
    ProfileService.friendRequests.get(targetId)?.push({
      senderId: userId,
      senderUsername
    });

    console.log(`[Friends] Friend request sent from ${userId} (${senderUsername}) to ${targetId}`);
    return { success: true };
  }

  async getFriendRequests(userId: string) {
    return ProfileService.friendRequests.get(userId) || [];
  }

  async acceptFriendRequest(userId: string, senderId: string) {
    // Mutually add to friendships
    if (!ProfileService.friendships.has(userId)) {
      ProfileService.friendships.set(userId, new Set());
    }
    ProfileService.friendships.get(userId)?.add(senderId);

    if (!ProfileService.friendships.has(senderId)) {
      ProfileService.friendships.set(senderId, new Set());
    }
    ProfileService.friendships.get(senderId)?.add(userId);
    
    // Remove request
    if (ProfileService.friendRequests.has(userId)) {
      const list = ProfileService.friendRequests.get(userId) || [];
      ProfileService.friendRequests.set(userId, list.filter(r => r.senderId !== senderId));
    }

    console.log(`[Friends] Friend request accepted mutually between ${userId} and ${senderId}`);
    return this.getFriends(userId);
  }

  async declineFriendRequest(userId: string, senderId: string) {
    if (ProfileService.friendRequests.has(userId)) {
      const list = ProfileService.friendRequests.get(userId) || [];
      ProfileService.friendRequests.set(userId, list.filter(r => r.senderId !== senderId));
    }
    console.log(`[Friends] Friend request declined from ${senderId} to ${userId}`);
    return { success: true };
  }

  private static challengeBlocks = new Map<string, Map<string, number>>();

  async blockChallenger(userId: string, challengerId: string, durationSec: number) {
    if (!ProfileService.challengeBlocks.has(userId)) {
      ProfileService.challengeBlocks.set(userId, new Map());
    }
    const expiration = Date.now() + durationSec * 1000;
    ProfileService.challengeBlocks.get(userId)?.set(challengerId, expiration);
    console.log(`[Friends] Challenge block: ${userId} blocked ${challengerId} for ${durationSec}s`);
    return { success: true, expires: expiration };
  }

  async checkBlock(userId: string, challengerId: string) {
    const userBlocks = ProfileService.challengeBlocks.get(userId);
    if (userBlocks) {
      const expiration = userBlocks.get(challengerId);
      if (expiration && expiration > Date.now()) {
        const remainingSec = Math.ceil((expiration - Date.now()) / 1000);
        return { blocked: true, remainingSec };
      }
    }
    return { blocked: false };
  }

  private static activeChallenges = new Map<string, Array<{ senderId: string; senderUsername: string; puzzleType: string; pin: string; status: 'pending' | 'declined' }>>();

  async createChallenge(senderId: string, targetId: string, puzzleType: string, pin: string) {
    const senderProfile = ProfileService.userRegistry.get(senderId);
    const senderUsername = senderProfile ? senderProfile.username : 'Someone';

    // Clear any previous challenges sent by this sender to avoid double challenge overlays
    for (const [receiverId, list] of ProfileService.activeChallenges.entries()) {
      const filtered = list.filter(c => c.senderId !== senderId);
      ProfileService.activeChallenges.set(receiverId, filtered);
    }

    if (!ProfileService.activeChallenges.has(targetId)) {
      ProfileService.activeChallenges.set(targetId, []);
    }
    ProfileService.activeChallenges.get(targetId)?.push({
      senderId,
      senderUsername,
      puzzleType,
      pin,
      status: 'pending'
    });
    console.log(`[Friends] Challenge created: ${senderUsername} (${senderId}) challenged ${targetId} with PIN ${pin}`);
    return { success: true };
  }

  async getChallenges(userId: string) {
    const list = ProfileService.activeChallenges.get(userId) || [];
    // Only return pending ones for the receiver popup
    return list.filter(c => c.status === 'pending');
  }

  async declineChallenge(userId: string, senderId: string) {
    if (ProfileService.activeChallenges.has(userId)) {
      const list = ProfileService.activeChallenges.get(userId) || [];
      list.forEach(c => {
        if (c.senderId === senderId) {
          c.status = 'declined';
        }
      });
    }
    console.log(`[Friends] Challenge declined: receiver ${userId} declined senderId ${senderId}`);
    return { success: true };
  }

  async getChallengeStatus(senderId: string, pin: string) {
    for (const [receiverId, list] of ProfileService.activeChallenges.entries()) {
      const match = list.find(c => c.senderId === senderId && c.pin === pin);
      if (match) {
        return { status: match.status };
      }
    }
    return { status: 'none' };
  }

  async clearChallenge(userId: string, senderId: string) {
    if (ProfileService.activeChallenges.has(userId)) {
      const list = ProfileService.activeChallenges.get(userId) || [];
      const filtered = list.filter(c => c.senderId !== senderId);
      ProfileService.activeChallenges.set(userId, filtered);
    }
    // Also clear from other keys just in case
    for (const [rId, list] of ProfileService.activeChallenges.entries()) {
      const filtered = list.filter(c => c.senderId !== senderId);
      ProfileService.activeChallenges.set(rId, filtered);
    }
    console.log(`[Friends] Challenge cleared: sender ${senderId} to receiver ${userId}`);
    return { success: true };
  }

  private static chatLogs = new Map<string, Array<{ senderId: string; senderUsername: string; text: string; timestamp: number }>>();
  private static lastClearedTimestamps = new Map<string, number>();

  private getFriendshipKey(userId: string, friendId: string): string {
    return [userId, friendId].sort().join('_');
  }

  async sendChatMessage(userId: string, friendId: string, text: string) {
    const words = (text || '').trim().split(/\s+/).filter(w => w.length > 0);
    if (words.length > 30) {
      throw new BadRequestException('Messages are limited to 30 words max.');
    }
    for (let i = 0; i < words.length; i++) {
      if (words[i].length > 20) {
        throw new BadRequestException('Each word is limited to 20 characters max.');
      }
    }

    const key = this.getFriendshipKey(userId, friendId);
    if (!ProfileService.chatLogs.has(key)) {
      ProfileService.chatLogs.set(key, []);
    }
    const senderProfile = ProfileService.userRegistry.get(userId);
    const senderUsername = senderProfile ? senderProfile.username : 'Someone';

    ProfileService.chatLogs.get(key)?.push({
      senderId: userId,
      senderUsername,
      text,
      timestamp: Date.now()
    });
    console.log(`[Chat] Message sent from ${userId} to ${friendId}: ${text}`);
    return { success: true };
  }

  async getChatHistory(userId: string, friendId: string) {
    const key = this.getFriendshipKey(userId, friendId);
    const messages = ProfileService.chatLogs.get(key) || [];
    const clearKey = `${userId}_${friendId}`;
    const clearedAt = ProfileService.lastClearedTimestamps.get(clearKey) || 0;
    const filtered = messages.filter(msg => msg.timestamp > clearedAt);
    return filtered.slice(-5);
  }

  async clearChatHistory(userId: string, friendId: string) {
    const clearKey = `${userId}_${friendId}`;
    ProfileService.lastClearedTimestamps.set(clearKey, Date.now());
    return { success: true };
  }

  private static userMailboxes = new Map<string, any[]>();
  private static globalMailbox: any[] = [
    {
      id: 'mail_01',
      type: 'announcement',
      title: '📢 System Update v1.2',
      content: 'Welcome to Cognerix! Enjoy our new real-time multiplayer 1v1 arenas, customizer store, and mutual friends list. Let the match begin!',
      claimed: false,
      date: 'July 15, 2026'
    },
    {
      id: 'mail_02',
      type: 'gift',
      title: '💎 Admin Welcome Gift',
      content: 'Claim your free gems and coins package to start purchasing frames and name colors!',
      rewardCoins: 1000,
      rewardGems: 100,
      claimed: false,
      date: 'July 15, 2026'
    }
  ];

  static pruneGlobalMailbox() {
    const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
    const now = Date.now();
    ProfileService.globalMailbox = ProfileService.globalMailbox.filter((item: any) => {
      if (item.id === 'mail_01' || item.id === 'mail_02') {
        return true;
      }
      let mailTime = item.timestamp;
      if (!mailTime) {
        const parts = item.id.split('_');
        if (parts.length >= 2) {
          const parsed = parseInt(parts[1], 10);
          if (!isNaN(parsed)) {
            mailTime = parsed;
          }
        }
      }
      if (!mailTime) return true;
      return (now - mailTime) < threeDaysMs;
    });
  }

  async getMailbox(userId: string) {
    ProfileService.pruneGlobalMailbox();
    if (!ProfileService.userMailboxes.has(userId)) {
      const clone = JSON.parse(JSON.stringify(ProfileService.globalMailbox));
      ProfileService.userMailboxes.set(userId, clone);
    }
    
    // Cleanup expired mails for this specific user
    const list = ProfileService.userMailboxes.get(userId) || [];
    const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
    const now = Date.now();
    const filtered = list.filter((item: any) => {
      if (item.id === 'mail_01' || item.id === 'mail_02') {
        return true;
      }
      let mailTime = item.timestamp;
      if (!mailTime) {
        const parts = item.id.split('_');
        if (parts.length >= 2) {
          const parsed = parseInt(parts[1], 10);
          if (!isNaN(parsed)) {
            mailTime = parsed;
          }
        }
      }
      if (!mailTime) return true;
      return (now - mailTime) < threeDaysMs;
    });
    
    ProfileService.userMailboxes.set(userId, filtered);
    return filtered;
  }

  async sendMail(senderId: string, targetId: string | undefined, mailType: 'announcement' | 'gift', title: string, content: string, rewardCoins?: number, rewardGems?: number) {
    const newItem = {
      id: 'mail_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      type: mailType,
      title: mailType === 'announcement' ? `📢 ${title}` : `🎁 ${title}`,
      content,
      rewardCoins,
      rewardGems,
      claimed: false,
      date: 'Just now',
      timestamp: Date.now()
    };

    if (targetId) {
      if (!ProfileService.userMailboxes.has(targetId)) {
        const clone = JSON.parse(JSON.stringify(ProfileService.globalMailbox));
        ProfileService.userMailboxes.set(targetId, clone);
      }
      ProfileService.userMailboxes.get(targetId)?.unshift(newItem);
      console.log(`[Mailbox] Sent private mail to ${targetId}: "${title}"`);
    } else {
      ProfileService.globalMailbox.unshift(JSON.parse(JSON.stringify(newItem)));
      for (const [userId, mailbox] of ProfileService.userMailboxes.entries()) {
        mailbox.unshift(JSON.parse(JSON.stringify(newItem)));
      }
      console.log(`[Mailbox] Sent global mail to all players: "${title}"`);
    }
    return { success: true, item: newItem };
  }

  async updateMailClaimed(userId: string, mailId: string) {
    const mailbox = await this.getMailbox(userId);
    let updated = false;
    mailbox.forEach((item: any) => {
      if (item.id === mailId) {
        item.claimed = true;
        updated = true;
      }
    });
    return { success: updated, mailbox };
  }

  // --- MODERATION / BAN SYSTEM ---
  static bannedProfileIds = new Set<string>();
  static bannedUserIds = new Set<string>();
  static bannedIps = new Set<string>();
  static banReasons = new Map<string, string>();
  static bannedPlayerIps = new Map<string, string>();
  static deletedProfileIds = new Set<string>();

  static {
    try {
      const filePath = ProfileService.getPersistencePath('deleted_players.json');
      if (fs.existsSync(filePath)) {
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const data = JSON.parse(fileContent);
        ProfileService.deletedProfileIds = new Set(data.deletedProfileIds || []);
        console.log(`[ProfileRegistry] Loaded ${ProfileService.deletedProfileIds.size} deleted profile(s) from persistence.`);
      }
    } catch (e) {
      console.error('[ProfileRegistry] Failed to load deleted players:', e);
    }
  }

  private static saveDeletedPlayers() {
    try {
      const filePath = ProfileService.getPersistencePath('deleted_players.json');
      fs.writeFileSync(filePath, JSON.stringify({
        deletedProfileIds: Array.from(ProfileService.deletedProfileIds)
      }, null, 2), 'utf-8');
      console.log('[ProfileRegistry] Saved deleted players to persistence.');
    } catch (e) {
      console.error('[ProfileRegistry] Failed to save deleted players:', e);
    }
  }

  static {
    try {
      const filePath = ProfileService.getPersistencePath('banned_players.json');
      if (fs.existsSync(filePath)) {
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const data = JSON.parse(fileContent);
        ProfileService.bannedProfileIds = new Set(data.bannedProfileIds || []);
        ProfileService.bannedUserIds = new Set(data.bannedUserIds || []);
        ProfileService.bannedIps = new Set(data.bannedIps || []);
        ProfileService.banReasons = new Map(Object.entries(data.banReasons || {}));
        ProfileService.bannedPlayerIps = new Map(Object.entries(data.bannedPlayerIps || {}));
        console.log(`[Moderation] Loaded ${ProfileService.bannedProfileIds.size} banned profile(s), ${ProfileService.bannedUserIds.size} banned user(s), ${ProfileService.bannedIps.size} banned IP(s), ${ProfileService.bannedPlayerIps.size} mapped IP(s), and ${ProfileService.banReasons.size} reason(s) from persistence.`);
      }
    } catch (e) {
      console.error('[Moderation] Failed to load banned players:', e);
    }
  }

  private static saveBannedPlayers() {
    try {
      const filePath = ProfileService.getPersistencePath('banned_players.json');
      const data = {
        bannedProfileIds: Array.from(ProfileService.bannedProfileIds),
        bannedUserIds: Array.from(ProfileService.bannedUserIds),
        bannedIps: Array.from(ProfileService.bannedIps),
        banReasons: Object.fromEntries(ProfileService.banReasons.entries()),
        bannedPlayerIps: Object.fromEntries(ProfileService.bannedPlayerIps.entries())
      };
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
      console.log('[Moderation] Saved banned players to persistence file.');
    } catch (e) {
      console.error('[Moderation] Failed to save banned players:', e);
    }
  }

  // --- USER REPORTS SYSTEM ---
  static reports: any[] = [];

  static {
    try {
      const filePath = ProfileService.getPersistencePath('reports.json');
      if (fs.existsSync(filePath)) {
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        ProfileService.reports = JSON.parse(fileContent) || [];
        console.log(`[Reports] Loaded ${ProfileService.reports.length} report(s) from persistence.`);
      }
    } catch (e) {
      console.error('[Reports] Failed to load reports:', e);
    }
  }

  private static saveReports() {
    try {
      const filePath = ProfileService.getPersistencePath('reports.json');
      fs.writeFileSync(filePath, JSON.stringify(ProfileService.reports, null, 2), 'utf-8');
      console.log('[Reports] Saved reports to persistence file.');
    } catch (e) {
      console.error('[Reports] Failed to save reports:', e);
    }
  }

  async banUser(profileId: string, reason?: string) {
    if (!profileId) {
      throw new BadRequestException('Profile ID is required.');
    }

    // Check if profileId is an IP address (contains . or :)
    const isIp = profileId.includes('.') || profileId.includes(':');
    if (isIp) {
      ProfileService.bannedIps.add(profileId);
      if (reason) {
        ProfileService.banReasons.set(profileId, reason);
      } else {
        ProfileService.banReasons.delete(profileId);
      }
      ProfileService.saveBannedPlayers();
      console.log(`[Moderation] Banned IP address directly: ${profileId}, Reason: ${reason || 'None'}`);
      return { success: true, bannedProfileId: null, bannedUserId: null, username: `IP: ${profileId}`, reason };
    }
    
    let userId: string | null = null;
    let username = '';
    let ipAddress = '';

    // 1. Try DB lookup
    try {
      const profile = await this.prisma.profile.findUnique({
        where: { id: profileId }
      });
      if (profile) {
        userId = profile.userId;
        username = profile.username;
      }
    } catch (e) {
      console.warn('[Ban] DB lookup failed, trying in-memory registry:', e);
    }

    // 2. Try in-memory registry
    const memProfile = ProfileService.userRegistry.get(profileId);
    if (memProfile) {
      if (!userId) {
        userId = memProfile.id;
        username = memProfile.username;
      }
      ipAddress = memProfile.ipAddress || '';
    }

    // 3. Fallback: if not found, assume profileId is the userId or treat it directly as userId
    if (!userId) {
      userId = profileId;
      username = `Player_${profileId.substring(profileId.length - 4)}`;
    }

    if (username.toLowerCase().includes('admin')) {
      throw new BadRequestException('Cannot ban an administrator account.');
    }

    ProfileService.bannedProfileIds.add(profileId);
    ProfileService.bannedUserIds.add(userId);
    if (ipAddress) {
      ProfileService.bannedIps.add(ipAddress);
      ProfileService.bannedPlayerIps.set(profileId, ipAddress);
      ProfileService.bannedPlayerIps.set(userId, ipAddress);
    }
    
    if (reason) {
      ProfileService.banReasons.set(profileId, reason);
      ProfileService.banReasons.set(userId, reason);
      if (ipAddress) {
        ProfileService.banReasons.set(ipAddress, reason);
      }
    } else {
      ProfileService.banReasons.delete(profileId);
      ProfileService.banReasons.delete(userId);
      if (ipAddress) {
        ProfileService.banReasons.delete(ipAddress);
      }
    }
    ProfileService.saveBannedPlayers();

    // Send a mail to the banned user
    if (profileId) {
      await this.sendMail(
        'admin',
        profileId,
        'announcement',
        'Account Suspended / Banned',
        `Your account has been banned. Reason: ${reason || 'No reason specified.'}`
      );
    }
    if (userId && userId !== profileId) {
      await this.sendMail(
        'admin',
        userId,
        'announcement',
        'Account Suspended / Banned',
        `Your account has been banned. Reason: ${reason || 'No reason specified.'}`
      );
    }

    console.log(`[Moderation] Banned player: ProfileID=${profileId}, UserID=${userId}, IP=${ipAddress || 'None'}, Username=${username}, Reason=${reason || 'None'}`);
    return { success: true, bannedProfileId: profileId, bannedUserId: userId, bannedIp: ipAddress || null, username, reason };
  }

  async unbanUser(profileId: string) {
    if (!profileId) {
      throw new BadRequestException('Profile ID is required.');
    }

    // Check if profileId is an IP address
    const isIp = profileId.includes('.') || profileId.includes(':');
    if (isIp) {
      ProfileService.bannedIps.delete(profileId);
      ProfileService.banReasons.delete(profileId);
      // Clean up from bannedPlayerIps map too
      for (const [pid, ip] of ProfileService.bannedPlayerIps.entries()) {
        if (ip === profileId) {
          ProfileService.bannedPlayerIps.delete(pid);
        }
      }
      ProfileService.saveBannedPlayers();
      console.log(`[Moderation] Unbanned IP address: ${profileId}`);
      return { success: true, unbannedProfileId: profileId };
    }

    let userId: string | null = null;
    let ipAddress = '';

    try {
      const profile = await this.prisma.profile.findUnique({
        where: { id: profileId }
      });
      if (profile) {
        userId = profile.userId;
      }
    } catch (e) {}

    const memProfile = ProfileService.userRegistry.get(profileId);
    if (memProfile) {
      if (!userId) {
        userId = memProfile.id;
      }
      ipAddress = memProfile.ipAddress || '';
    }

    // Retrieve associated IP address from bannedPlayerIps map (in case they are not in memory registry)
    if (!ipAddress) {
      ipAddress = ProfileService.bannedPlayerIps.get(profileId) || '';
      if (!ipAddress && userId) {
        ipAddress = ProfileService.bannedPlayerIps.get(userId) || '';
      }
    }

    ProfileService.bannedProfileIds.delete(profileId);
    if (userId) {
      ProfileService.bannedUserIds.delete(userId);
      ProfileService.banReasons.delete(userId);
    }
    ProfileService.bannedUserIds.delete(profileId); // in case profileId was used as userId
    ProfileService.banReasons.delete(profileId);
    
    if (ipAddress) {
      ProfileService.bannedIps.delete(ipAddress);
      ProfileService.banReasons.delete(ipAddress);
      ProfileService.bannedPlayerIps.delete(profileId);
      if (userId) {
        ProfileService.bannedPlayerIps.delete(userId);
      }
    }
    ProfileService.saveBannedPlayers();

    console.log(`[Moderation] Unbanned player: ProfileID=${profileId}, IP=${ipAddress || 'None'}`);
    return { success: true, unbannedProfileId: profileId };
  }

  async getBannedPlayers() {
    return {
      bannedProfileIds: Array.from(ProfileService.bannedProfileIds),
      bannedUserIds: Array.from(ProfileService.bannedUserIds),
      bannedIps: Array.from(ProfileService.bannedIps),
      banReasons: Object.fromEntries(ProfileService.banReasons.entries())
    };
  }

  async submitReport(reportData: {
    reportingProfileId: string;
    opponentProfileId: string;
    opponentNickname: string;
    nickname: string;
    reason: string;
    description?: string;
    sessionId?: string;
  }) {
    if (!reportData.reportingProfileId || !reportData.opponentProfileId || !reportData.opponentNickname || !reportData.nickname || !reportData.reason) {
      throw new BadRequestException('Reporting player Profile ID, Opponent Profile ID, Opponent Nickname, Nickname, and Reason are required.');
    }

    const newReport = {
      id: 'rep_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      timestamp: new Date().toISOString(),
      ...reportData
    };

    ProfileService.reports.push(newReport);
    ProfileService.saveReports();

    // Send email via nodemailer
    const emailResult = await this.sendEmailReport(newReport);
    return { success: true, report: newReport, emailResult };
  }

  private sendEmailReport(report: any) {
    try {
      console.log(`[Email] Attempting to send report to cognerixissue@gmail.com...`);
      const gmailUser = process.env.GMAIL_USER;
      const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;

      if (!gmailUser || !gmailAppPassword) {
        console.log(`[Email] [SIMULATION] GMAIL_USER or GMAIL_APP_PASSWORD not configured. Email report simulated successfully.`);
        console.log(`[Email] [SIMULATION] Sent to: cognerixissue@gmail.com`);
        console.log(`[Email] [SIMULATION] Subject: [Report] Opponent reported: ${report.opponentProfileId}`);
        console.log(`[Email] [SIMULATION] Content:\n`, JSON.stringify(report, null, 2));
        return { success: true, simulated: true };
      }

      const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
          user: gmailUser,
          pass: gmailAppPassword,
        },
      });

      const mailOptions = {
        from: `"Cognerix Report System" <${gmailUser}>`,
        to: 'cognerixissue@gmail.com',
        subject: `⚠️ [USER REPORT] Player ${report.nickname} reported opponent ${report.opponentNickname || report.opponentProfileId}`,
        text: `
User Report Received:
----------------------------
Report ID:                   ${report.id}
Reporting Player Profile ID: ${report.reportingProfileId}
Reporter Username:           ${report.nickname}
Opponent Profile ID:         ${report.opponentProfileId}
Reported Player Nickname:    ${report.opponentNickname || 'N/A'}
Selected Reason:             ${report.reason}
Detailed Description:        ${report.description || 'N/A'}
Session / Match ID:          ${report.sessionId || 'N/A'}
----------------------------
Reported on:                 ${report.timestamp}
`
      };

      // Send email without awaiting it
      transporter.sendMail(mailOptions).then(info => {
        console.log(`[Email] Sent successfully: messageId=${info.messageId}`);
      }).catch(err => {
        console.error('[Report] Email send failed:', err.message);
      });

      return { success: true };
    } catch (e) {
      console.error('[Email] Failed to initiate email report:', e);
      return { success: false, error: (e as any).message };
    }
  }

  async submitSupport(data: {
    name: string;
    email: string;
    userId: string;
    subject: string;
    description: string;
  }) {
    if (!data.name || !data.email || !data.userId || !data.subject || !data.description) {
      throw new BadRequestException('All fields (Name, Email, ID, Subject, Description) are required.');
    }

    const newTicket = {
      id: 'ticket_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      timestamp: new Date().toISOString(),
      ...data
    };

    // Send email to cognerix.support@gmail.com
    const emailResult = await this.sendSupportEmail(newTicket);
    return { success: true, ticket: newTicket, emailResult };
  }

  private async sendSupportEmail(ticket: any) {
    try {
      console.log(`[Email] Attempting to send support ticket to cognerix.support@gmail.com...`);
      if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
        console.log(`[Email] [SIMULATION] SMTP not configured. Support email simulated successfully.`);
        console.log(`[Email] [SIMULATION] Sent to: cognerix.support@gmail.com`);
        console.log(`[Email] [SIMULATION] Subject: [Support Ticket] ${ticket.subject}`);
        console.log(`[Email] [SIMULATION] Content:\n`, JSON.stringify(ticket, null, 2));
        return { success: true, simulated: true };
      }

      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      const info = await transporter.sendMail({
        from: `"Cognerix Help & Support" <${process.env.SMTP_USER}>`,
        to: 'cognerix.support@gmail.com',
        replyTo: ticket.email,
        subject: `📬 [Help & Support] Ticket: ${ticket.subject} (From: ${ticket.name})`,
        text: `
Support Ticket Received:
----------------------------
Ticket ID:           ${ticket.id}
User Name:           ${ticket.name}
Email Address:       ${ticket.email}
User Profile ID:     ${ticket.userId}
Subject:             ${ticket.subject}
----------------------------
Description of the Issue:
${ticket.description}
----------------------------
Submitted on:        ${ticket.timestamp}
`
      });

      console.log(`[Email] Support email sent successfully: messageId=${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (e) {
      console.error('[Email] Failed to send support email via SMTP:', e);
      return { success: true, error: (e as any).message };
    }
  }

  static savePopupAnnouncementsToDisk() {
    try {
      const filePath = ProfileService.getPersistencePath('popup_announcements.json');
      fs.writeFileSync(filePath, JSON.stringify(ProfileService.popupAnnouncements, null, 2), 'utf-8');
    } catch (e) {
      console.error('[PopupAnnouncements] Failed to save popup_announcements.json:', e);
    }
  }

  async createPopupAnnouncement(text: string, targetUserIds?: string) {
    if (!text || !text.trim()) {
      throw new BadRequestException('Message text cannot be empty');
    }
    
    let targets: string[] = [];
    if (targetUserIds && targetUserIds.trim()) {
      targets = targetUserIds.split(',')
        .map(id => id.trim())
        .filter(id => id.length > 0);
    }

    const newAnnouncement = {
      id: 'popup_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      text: text.trim(),
      targetUserIds: targets,
      timestamp: Date.now()
    };

    ProfileService.popupAnnouncements.push(newAnnouncement);
    ProfileService.savePopupAnnouncementsToDisk();

    console.log(`[PopupAnnouncements] Created new popup announcement: "${text}" targeting ${targets.length ? targets.join(', ') : 'all'}`);
    return { success: true, announcement: newAnnouncement };
  }

  async getPopupAnnouncements(userId: string) {
    return ProfileService.popupAnnouncements.filter(ann => {
      if (!ann.targetUserIds || ann.targetUserIds.length === 0) {
        return true;
      }
      return ann.targetUserIds.includes(userId);
    });
  }

  async getAllPopupAnnouncements() {
    return ProfileService.popupAnnouncements;
  }

  async deletePopupAnnouncement(id: string) {
    const idx = ProfileService.popupAnnouncements.findIndex(a => a.id === id);
    if (idx === -1) {
      throw new BadRequestException('Announcement not found');
    }
    const removed = ProfileService.popupAnnouncements.splice(idx, 1)[0];
    ProfileService.savePopupAnnouncementsToDisk();
    console.log(`[PopupAnnouncements] Deleted announcement: "${removed.text}" (id: ${id})`);
    return { success: true, deletedId: id };
  }
}
