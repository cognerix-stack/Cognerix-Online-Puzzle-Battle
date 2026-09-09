import * as jwt from 'jsonwebtoken';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProfileService } from '../profile/profile.service';
import { RankName } from '@puzzle-verse/shared';
import { OAuth2Client } from 'google-auth-library';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  private getSecret(): string {
    return process.env.JWT_SECRET || 'cognerix_jwt_secret_2026_secure_key';
  }

  // Real JWT token signing helper with required isAdmin claim
  createToken(payload: { userId: string; username: string; email?: string; isAdmin: boolean }): string {
    return jwt.sign(
      {
        userId: payload.userId,
        username: payload.username,
        email: payload.email || '',
        isAdmin: payload.isAdmin
      },
      this.getSecret(),
      { expiresIn: '7d' }
    );
  }

  // Decode and validate JWT token payload
  validateToken(token: string): { userId: string; username: string; email?: string; isAdmin: boolean } {
    try {
      const decoded = jwt.verify(token, this.getSecret()) as any;
      return {
        userId: decoded.userId,
        username: decoded.username,
        email: decoded.email,
        isAdmin: decoded.isAdmin === true
      };
    } catch {
      throw new UnauthorizedException('Invalid authorization token');
    }
  }

  // Handle anonymous/Guest login
  async loginGuest(usernameInput?: string) {
    const defaultUsername = usernameInput || `Guest_${Math.floor(Math.random() * 9000 + 1000)}`;

    // Create a new User and Profile in the database
    const user = await this.prisma.user.create({
      data: {
        profile: {
          create: {
            username: defaultUsername,
            level: 1,
            xp: 0,
            coins: 100,
            gems: 10,
            rank: RankName.BRONZE,
            badges: [],
            inventory: [],
          },
        },
      },
      include: {
        profile: true,
      },
    });

    const token = this.createToken({ userId: user.id, username: user.profile!.username, isAdmin: false });
    return { token, profile: user.profile, isAdmin: false };
  }

  // Handle Firebase Token Verification (stubs)
  async validateFirebaseToken(firebaseToken: string, email?: string, name?: string) {
    if (!firebaseToken) {
      throw new UnauthorizedException('Missing Firebase auth token');
    }

    const firebaseId = `fb_${firebaseToken.slice(-12)}`;
    const emailAddr = email || `${firebaseId}@cognerix.io`;
    const defaultName = name || `Player_${Math.floor(Math.random() * 9000 + 1000)}`;
    const isConfiguredAdmin = emailAddr.toLowerCase() === 'admin.cognerix@gmail.com';

    let user = await this.prisma.user.findUnique({
      where: { firebaseId },
      include: { profile: true },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          firebaseId,
          email: emailAddr,
          profile: {
            create: {
              username: defaultName,
              level: 1,
              xp: 0,
              coins: 100,
              gems: 10,
              rank: RankName.BRONZE,
              badges: [],
              inventory: [],
            },
          },
        },
        include: { profile: true },
      });
    }

    const token = this.createToken({ userId: user.id, username: user.profile!.username, email: emailAddr, isAdmin: isConfiguredAdmin });
    return { token, profile: user.profile, isAdmin: isConfiguredAdmin };
  }

  async validateGoogleToken(idToken: string) {
    if (!idToken) {
      throw new UnauthorizedException('Missing Google ID token');
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      throw new UnauthorizedException('Google Client ID is not configured on the server');
    }

    const client = new OAuth2Client(clientId);
    let payload: any;
    try {
      const ticket = await client.verifyIdToken({
        idToken,
        audience: [
          clientId,
          '205247808441-1q2bi6rq0g9omibkcv99hgnn8icd91s9.apps.googleusercontent.com',
          '205247808441-cj93adqm6cb7kbcobi6bblg5tuq45tdj.apps.googleusercontent.com'
        ],
      });
      payload = ticket.getPayload();
    } catch (err: any) {
      console.error('[AuthService] Google token verification failed:', err.message);
      throw new UnauthorizedException('Invalid Google ID token');
    }

    if (!payload || !payload.sub) {
      throw new UnauthorizedException('Google token payload missing user identity');
    }

    console.log('[GOOGLE AUTH] Received:', { googleId: payload.sub, email: payload.email });

    const googleId = payload.sub;
    const email = payload.email || '';
    const name = payload.name || `Player_${Math.floor(Math.random() * 9000 + 1000)}`;

    const isConfiguredAdmin = email.toLowerCase() === 'admin.cognerix@gmail.com';
    console.log(`[AuthService] Google Sign-In verified for: ${name} (${email}), sub: ${googleId}, isAdmin: ${isConfiguredAdmin}`);

    try {
      let user = await this.prisma.user.findFirst({
        where: {
          firebaseId: googleId
        },
        include: { profile: true },
      });

      if (user) {
        if (isConfiguredAdmin && (user.profile!.username !== 'admin' || user.email !== 'admin.cognerix@gmail.com' || user.firebaseId !== googleId)) {
          user = await this.prisma.user.update({
            where: { id: user.id },
            data: {
              firebaseId: googleId,
              email: 'admin.cognerix@gmail.com',
              profile: {
                update: {
                  username: 'admin'
                }
              }
            },
            include: { profile: true }
          });
        }
      } else {
        user = await this.prisma.user.create({
          data: {
            firebaseId: googleId,
            email,
            profile: {
              create: {
                username: isConfiguredAdmin ? 'admin' : name,
                level: isConfiguredAdmin ? 3 : 1,
                xp: isConfiguredAdmin ? 65 : 0,
                coins: isConfiguredAdmin ? 13630 : 100,
                gems: isConfiguredAdmin ? 1319 : 10,
                rank: RankName.BRONZE,
                badges: [],
                inventory: [],
                avatar: 'ðŸ‘¤',
                frame: 'none',
                status: 'Ready to solve the universe.',
                lobbyEntranceAnimation: '',
              },
            },
          },
          include: { profile: true },
        });
      }

      const token = this.createToken({ userId: user.id, username: user.profile!.username, email: user.email ?? undefined, isAdmin: isConfiguredAdmin });

      ProfileService.setRegistryUser(user.id, {
        id: user.id,
        username: user.profile!.username,
        avatar: user.profile!.avatar || 'ðŸ‘¤',
        frame: user.profile!.frame || 'none',
        rank: user.profile!.rank || 'BRONZE',
        nameColor: (user.profile as any)?.nameColor || '',
        coins: user.profile!.coins,
        gems: user.profile!.gems,
        level: user.profile!.level,
        xp: user.profile!.xp,
        badges: (user.profile as any)?.badges || [],
        inventory: (user.profile as any)?.inventory || [],
        lobbyEntranceAnimation: (user.profile as any)?.lobbyEntranceAnimation || '',
        status: 'online',
        lastSeen: Date.now(),
        email: user.email ?? undefined,
        ipAddress: '',
        score: 0,
        statistics: null,
      });

      return {
        token,
        userId: user.id,
        profile: {
          id: user.id,
          username: user.profile!.username,
          avatar: user.profile!.avatar || 'ðŸ‘¤',
          frame: user.profile!.frame || 'none',
          rank: user.profile!.rank || 'BRONZE',
          nameColor: (user.profile as any)?.nameColor || '',
          coins: user.profile!.coins,
          gems: user.profile!.gems,
          level: user.profile!.level,
          xp: user.profile!.xp,
          badges: (user.profile as any)?.badges || [],
          inventory: (user.profile as any)?.inventory || [],
          status: (user.profile as any)?.status || 'Ready to solve the universe.',
          lobbyEntranceAnimation: (user.profile as any)?.lobbyEntranceAnimation || '',
          email: user.email ?? undefined,
          statistics: {
            gamesPlayed: 0,
            gamesWon: 0,
            totalSolveTime: 0,
            highestStreak: 0,
            puzzleSpecificStats: {},
          },
        },
        isAdmin: isConfiguredAdmin,
      };
    } catch (dbErr: any) {
      console.warn('[AuthService] Database unavailable for Google login, falling back to memory:', dbErr.message);

      const userId = isConfiguredAdmin ? '101698362403' : `10${googleId}`;

      const memProfile = ProfileService.getRegistryUser(userId);
      if (memProfile) {
        if (isConfiguredAdmin) {
          memProfile.email = 'admin.cognerix@gmail.com';
          memProfile.username = 'admin';
        }
        const token = this.createToken({ userId, username: memProfile.username, email: memProfile.email, isAdmin: isConfiguredAdmin });
        return { token, userId, profile: memProfile, isAdmin: isConfiguredAdmin };
      }

      const defaultProfile = {
        id: userId,
        username: isConfiguredAdmin ? 'admin' : name,
        email,
        level: isConfiguredAdmin ? 3 : 1,
        xp: isConfiguredAdmin ? 65 : 0,
        coins: isConfiguredAdmin ? 13630 : 100,
        gems: isConfiguredAdmin ? 1319 : 10,
        rank: RankName.BRONZE,
        badges: [] as string[],
        inventory: [] as string[],
        avatar: 'ðŸ‘¤',
        frame: 'none',
        status: 'Ready to solve the universe.',
        lobbyEntranceAnimation: '',
        statistics: {
          gamesPlayed: 0,
          gamesWon: 0,
          totalSolveTime: 0,
          highestStreak: 0,
          puzzleSpecificStats: {},
        },
      };

      ProfileService.setRegistryUser(userId, {
        ...defaultProfile,
        nameColor: '',
        score: 0,
        lastSeen: Date.now(),
        ipAddress: '',
      } as any);

      const token = this.createToken({ userId, username: defaultProfile.username, email: defaultProfile.email, isAdmin: isConfiguredAdmin });
      return { token, userId, profile: defaultProfile, isAdmin: isConfiguredAdmin };
    }
  }
}