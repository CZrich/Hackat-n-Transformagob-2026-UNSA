import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { config } from '../config';
import type { User, UserRole } from '../common/types';

interface GooglePayload {
  email: string;
  name: string;
  role: UserRole;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async googleLogin(googleToken: string): Promise<{ user: User; token: string }> {
    let payload: GooglePayload;

    try {
      payload = this.decodeMockGoogleToken(googleToken);
    } catch {
      throw new UnauthorizedException('Token de Google inválido');
    }

    const isEmailAllowed =
      payload.email.endsWith(config.allowedDomain) || payload.email.endsWith('@gmail.com');

    if (!isEmailAllowed) {
      throw new UnauthorizedException(
        `El correo debe pertenecer al dominio ${config.allowedDomain}`,
      );
    }

    let user = await this.usersService.findByEmail(payload.email);
    if (!user) {
      user = await this.usersService.create({
        email: payload.email,
        name: payload.name,
        role: payload.role,
        carrera:
          payload.role === 'EGRESADO'
            ? 'Ingeniería de Sistemas'
            : undefined,
        telefono: '+51900000000',
      });
    }

    const token = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
      carrera: user.carrera,
    });

    return { user, token };
  }

  private decodeMockGoogleToken(token: string): GooglePayload {
    if (!token.startsWith('mock-google-token-')) {
      throw new Error('Token simulado inválido');
    }

    const parts = token.replace('mock-google-token-', '').split('-');
    const email = parts.slice(0, -1).join('-');
    const role = parts[parts.length - 1] as UserRole;

    if (!['EGRESADO', 'EMPLEADOR', 'ADMIN'].includes(role)) {
      throw new Error('Rol inválido en el token');
    }

    return {
      email,
      name: email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      role,
    };
  }
}
