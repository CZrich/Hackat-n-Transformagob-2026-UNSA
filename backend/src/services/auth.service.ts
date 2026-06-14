import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { config } from '../config';
import type { User, UserRole } from '../common/types';

const googleClient = new OAuth2Client(config.google.clientId);

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  private signToken(user: {
    id: string;
    email: string;
    role: string;
    carrera: string | null;
  }): string {
    return this.jwtService.sign(
      { sub: user.id, email: user.email, role: user.role, carrera: user.carrera },
      { algorithm: 'RS256' },
    );
  }

  private mapUser(user: {
    id: string;
    email: string;
    name: string;
    role: string;
    carrera: string | null;
    telefono: string | null;
    created_at: Date;
    company?: {
      ruc: string;
      name: string;
      rubro: string;
      es_verificada: boolean;
      es_baneada: boolean;
    } | null;
  }): User {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as UserRole,
      carrera: user.carrera ?? undefined,
      telefono: user.telefono ?? undefined,
      created_at: user.created_at.toISOString(),
      ...(user.company && {
        ruc: user.company.ruc,
        rubro: user.company.rubro,
        es_verificada: user.company.es_verificada,
        es_baneada: user.company.es_baneada,
        contact_name: user.name,
      }),
    };
  }

  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { company: true },
    });
    if (!user || !user.password) {
      throw new UnauthorizedException('Credenciales inválidas');
    }
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }
    const token = this.signToken(user);
    return { user: this.mapUser(user), token };
  }

  async register(data: {
    email: string;
    password: string;
    name: string;
    role: UserRole;
    carrera?: string;
    telefono?: string;
    ruc?: string;
    contact_name?: string;
    rubro?: string;
  }): Promise<{ user: User; token: string }> {
    const existing = await this.usersService.findByEmail(data.email);
    if (existing) {
      throw new ConflictException('El correo ya está registrado');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        name: data.name,
        role: data.role,
        carrera: data.carrera,
        telefono: data.telefono,
        skills: [],
      },
    });

    let createdCompany = null;
    if (data.role === 'EMPLEADOR' && data.ruc) {
      createdCompany = await this.prisma.company.create({
        data: {
          ruc: data.ruc,
          name: data.name,
          rubro: data.rubro || 'No especificado',
          direccion: '',
          horario: null,
          userId: user.id,
        },
      });
    }

    const token = this.signToken(user);
    return { user: this.mapUser({ ...user, company: createdCompany }), token };
  }

  async googleLogin(googleToken: string): Promise<{ user: User; token: string }> {
    let payload: { email: string; name: string; sub: string };

    try {
      const ticket = await googleClient.verifyIdToken({
        idToken: googleToken,
        audience: config.google.clientId,
      });
      const decoded = ticket.getPayload();
      if (!decoded || !decoded.email) throw new Error('No se pudo obtener el email');
      payload = {
        email: decoded.email,
        name: decoded.name || decoded.email.split('@')[0],
        sub: decoded.sub,
      };
    } catch {
      try {
        const response = await fetch(
          `https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=${googleToken}`,
        );
        if (!response.ok) throw new Error('Token inválido');
        const data = await response.json();
        if (!data.email) throw new Error('No se pudo obtener el email');
        payload = {
          email: data.email,
          name: (data as any).name || data.email.split('@')[0],
          sub: data.sub,
        };
      } catch {
        throw new UnauthorizedException('Token de Google inválido o expirado');
      }
    }

    const role: UserRole = payload.email.endsWith(config.allowedDomain) ? 'EGRESADO' : 'EMPLEADOR';

    let user: any = await this.usersService.findByEmail(payload.email);
    if (!user) {
      const newUser = await this.prisma.user.create({
        data: {
          email: payload.email,
          name: payload.name,
          role,
          carrera: role === 'EGRESADO' ? 'Ingeniería de Sistemas' : undefined,
          telefono: '+51900000000',
          skills: [],
        },
      });

      let company = null;
      if (role === 'EMPLEADOR') {
        company = await this.prisma.company.create({
          data: {
            ruc: `TEMP-${Date.now()}`, // Temporary RUC that they will replace during onboarding complete
            name: payload.name,
            rubro: 'No especificado',
            direccion: '',
            horario: null,
            userId: newUser.id,
          },
        });
      }

      user = { ...newUser, company };
    }

    const token = this.signToken(user);
    return { user: this.mapUser(user), token };
  }
}
