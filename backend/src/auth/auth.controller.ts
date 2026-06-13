import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('google-login')
  async googleLogin(@Body() body: { token: string }) {
    return this.authService.googleLogin(body.token);
  }
}
