import { Controller, Post, Get, Body, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from './auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Get('me')
  @UseGuards(AuthGuard)
  async getMe(@Request() req: any) {
    return {
      userId: req.user.userId,
      username: req.user.username,
      email: req.user.email || '',
      isAdmin: req.user.isAdmin === true,
    };
  }

  @Post('guest')
  async loginGuest(@Body('username') username?: string) {
    return this.authService.loginGuest(username);
  }

  @Post('firebase')
  async loginFirebase(
    @Body('token') token: string,
    @Body('email') email?: string,
    @Body('name') name?: string,
  ) {
    return this.authService.validateFirebaseToken(token, email, name);
  }

  @Get('google-client-id')
  getGoogleClientId() {
    return { googleClientId: process.env.GOOGLE_CLIENT_ID || '' };
  }

  @Post('google-login')
  async googleLogin(@Body('token') token: string) {
    return this.authService.validateGoogleToken(token);
  }
}