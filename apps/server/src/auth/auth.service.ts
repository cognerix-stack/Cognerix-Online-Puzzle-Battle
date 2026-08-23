import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProfileService } from '../profile/profile.service';
import { RankName } from '@puzzle-verse/shared';
import { OAuth2Client } from 'google-auth-library';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  // Simple token signing helper (Base64 JWT-like payload)
  private createToken(payload: { userId: string; username: string }): string {
    const raw = JSON.stringify({ ...payload, exp: Date.now() + 1000 * 60 * 60 * 24 }); // 24 hours
    return Buffer.from(raw).toString('base64');
  }

  // Decode and validate token payload
  validateToken(token: string): { userId: string; username: string } {
    try {
      const decoded = JSON.parse(Buffer.from(token, 'base64').toString('ascii'));
      if (decoded.exp < Date.now()) {
        throw new UnauthorizedException('Token expired');
      }
      return { userId: decoded.userId, username: decoded.username };
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

    const token = this.createToken({ userId: user.id, username: user.profile!.username });
    return { token, profile: user.profile };
  }

  // Handle Firebase Token Verification (stubs)
  async validateFirebaseToken(firebaseToken: string, email?: string, name?: string) {
    // In production, we would use: const decodedToken = await admin.auth().verifyIdToken(firebaseToken);
    // Since this is a local sandbox, we will mock the authentication validation:
    if (!firebaseToken) {
      throw new UnauthorizedException('Missing Firebase auth token');
    }

    const firebaseId = `fb_${firebaseToken.slice(-12)}`; // stub ID from token slice
    const emailAddr = email || `${firebaseId}@cognerix.io`;
    const defaultName = name || `Player_${Math.floor(Math.random() * 9000 + 1000)}`;

    // Find or create the user linked to this Firebase ID
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

    const token = this.createToken({ userId: user.id, username: user.profile!.username });
    return { token, profile: user.profile };
  }

  /**
   * Verify a real Google ID Token (JWT credential) from Google Identity Services.
   *
   * Uses google-auth-library to cryptographically verify the token, then extracts
   * the user's Google ID (sub), email, and display name from the verified payload.
   *
   * NOTE: We store Google's unique "sub" identifier in the Prisma User.firebaseId
   * column. This is intentional — the firebaseId field already exists as a unique
   * string column and serves the same purpose (external identity provider ID).
   * Renaming it would require a database migration. Future developers: if you see
   * a Google sub ID stored in firebaseId, this is expected behavior.
   */
  async validateGoogleToken(idToken: string) {
    if (!idToken) {
      throw new UnauthorizedException('Missing Google ID token');
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      throw new UnauthorizedException('Google Client ID is not configured on the server');
    }

    // 1. Verify the token cryptographically with Google
    const client = new OAuth2Client(clientId);
    let payload: any;
    try {
      const ticket = await client.verifyIdToken({
        idToken,
        audience: clientId,
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

    const googleId = payload.sub;        // Google's unique user identifier
    const email = payload.email || '';
    const name = payload.name || `Player_${Math.floor(Math.random() * 9000 + 1000)}`;
    const picture = payload.picture || '';

    const isConfiguredAdmin = email.toLowerCase() === 'admin.cognerix@gmail.com';
    console.log(`[AuthService] Google Sign-In verified for: ${name} (${email}), sub: ${googleId}, isAdmin: ${isConfiguredAdmin}`);

    // 2. Try database lookup first — find user by firebaseId (which stores Google sub) or admin email
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
        // Create new user + profile in database
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
                avatar: '👤',
                frame: 'none',
                status: 'Ready to solve the universe.',
                lobbyEntranceAnimation: '',
              },
            },
          },
          include: { profile: true },
        });
        console.log(`[AuthService] Created new Google user in database: ${user.profile!.username} (${googleId})`);
      }

      const token = this.createToken({ userId: user.id, username: user.profile!.username });

      // Populate memory registry so sync/leaderboard systems can find this user
      ProfileService.setRegistryUser(user.id, {
        id: user.id,
        username: user.profile!.username,
        avatar: user.profile!.avatar || '👤',
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
        email: user.email,
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
          avatar: user.profile!.avatar || '👤',
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
          email: user.email,
          statistics: {
            gamesPlayed: 0,
            gamesWon: 0,
            totalSolveTime: 0,
            highestStreak: 0,
            puzzleSpecificStats: {},
          },
        },
      };
    } catch (dbErr: any) {
      // Database offline — fall back to memory registry via loadOrCreateProfile pattern
      console.warn('[AuthService] Database unavailable for Google login, falling back to memory:', dbErr.message);

      // Use a deterministic userId from the Google sub so it's consistent across logins
      const userId = isConfiguredAdmin ? '101698362403' : `10${googleId}`;

      // Try memory registry
      const memProfile = ProfileService.getRegistryUser(userId);
      if (memProfile) {
        if (isConfiguredAdmin) {
          memProfile.email = 'admin.cognerix@gmail.com';
          memProfile.username = 'admin';
        }
        const token = this.createToken({ userId, username: memProfile.username });
        return { token, userId, profile: memProfile };
      }

      // Create a new in-memory profile
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
        avatar: '👤',
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

      const token = this.createToken({ userId, username: defaultProfile.username });
      return { token, userId, profile: defaultProfile };
    }
  }
}
