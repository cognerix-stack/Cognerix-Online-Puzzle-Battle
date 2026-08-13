import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    try {
      await this.$connect();
      console.log('✅ Database connection established.');
    } catch (e) {
      console.warn('⚠️ Warning: Could not connect to PostgreSQL. Running in offline/fallback database mode.');
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
