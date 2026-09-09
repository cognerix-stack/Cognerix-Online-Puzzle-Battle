import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ProfileModule } from './profile/profile.module';
import { LeaderboardModule } from './leaderboard/leaderboard.module';
import { CustomThrottlerGuard } from './auth/custom-throttler.guard';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 60 }]), // 60 requests per minute global
    PrismaModule,
    AuthModule,
    ProfileModule,
    LeaderboardModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: CustomThrottlerGuard }],
})
export class AppModule {}