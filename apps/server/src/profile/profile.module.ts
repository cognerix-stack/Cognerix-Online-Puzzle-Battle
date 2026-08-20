import { Module } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { ProfileController } from './profile.controller';
import { AdminController } from './admin.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  providers: [ProfileService],
  controllers: [ProfileController, AdminController],
  exports: [ProfileService],
})
export class ProfileModule {}
