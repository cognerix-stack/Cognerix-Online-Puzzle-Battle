import { Controller, Post, Get, Body } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

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

  /**
   * Returns the configured Google OAuth Client ID to the frontend.
   * The frontend uses this to dynamically initialize Google Identity Services.
   * If empty, the frontend falls back to mock email/name input fields.
   */
  @Get('google-client-id')
  getGoogleClientId() {
    return { googleClientId: process.env.GOOGLE_CLIENT_ID || '' };
  }

  /**
   * Accepts a Google ID Token (JWT credential) from the frontend after the user
   * signs in with Google Identity Services. Verifies the token server-side,
   * extracts the user's identity, and returns a session JWT + profile.
   */
  @Post('google-login')
  async googleLogin(@Body('token') token: string) {
    return this.authService.validateGoogleToken(token);
  }
}
