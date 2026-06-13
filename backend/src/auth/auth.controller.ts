import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from '../services/auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('google-login')
  async googleLogin(@Body() body: { token: string }) {
    return this.authService.googleLogin(body.token);
  }

  @Post('login')
  async login(@Body() body: { email: string; password: string }) {
    return this.authService.login(body.email, body.password);
  }

  @Post('register')
  async register(@Body() body: {
    email: string;
    password: string;
    name: string;
    role: 'EGRESADO' | 'EMPLEADOR';
    carrera?: string;
    telefono?: string;
    ruc?: string;
    contact_name?: string;
    rubro?: string;
  }) {
    return this.authService.register(body);
  }
}
