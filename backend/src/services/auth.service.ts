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

  private async signToken(userId: string, email: string, role: string): Promise<string> {
    let carrera: string | null = null;
    if (role === 'EGRESADO') {
      const profile = await this.prisma.graduateProfile.findUnique({ where: { userId } });
      carrera = profile?.carrera || null;
    }
    return this.jwtService.sign(
      { sub: userId, email, role, carrera },
      { algorithm: 'RS256' },
    );
  }

  private async mapUser(user: {
    id: string;
    email: string;
    name: string;
    role: string;
    created_at: Date;
    company?: Record<string, any> | null;
    profile?: Record<string, any> | null;
  }): Promise<User> {
    const p = user.profile;
    const c = user.company;
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as UserRole,
      carrera: p?.carrera ?? undefined,
      telefono: p?.telefono ?? undefined,
      created_at: user.created_at instanceof Date ? user.created_at.toISOString() : String(user.created_at),
      ...(c && {
        ruc: c.ruc,
        rubro: c.rubro,
        direccion: c.direccion || undefined,
        horario: c.horario || undefined,
        contacto_telefono: c.contacto_telefono || undefined,
        contacto_email: c.contacto_email || undefined,
        es_verificada: c.es_verificada,
        es_baneada: c.es_baneada,
        rating_promedio: c.rating_promedio,
        total_votos: c.total_votos,
        contact_name: user.name,
      }),
    };
  }

  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { company: true, profile: true },
    });
    if (!user || !user.password) {
      throw new UnauthorizedException('Credenciales inválidas');
    }
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }
    const token = await this.signToken(user.id, user.email, user.role);
    return { user: await this.mapUser(user), token };
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
      },
    });

    if (data.role === 'EGRESADO') {
      await this.prisma.graduateProfile.create({
        data: {
          userId: user.id,
          carrera: data.carrera || '',
          telefono: data.telefono || '',
          skills: [],
        },
      });
    }

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

    const token = await this.signToken(user.id, user.email, user.role);
    return { user: await this.mapUser({ ...user, company: createdCompany }), token };
  }

  async googleLogin(googleToken: string): Promise<{ user: User; token: string }> {
    let payload: { email: string; name: string; sub: string; picture?: string };

    // Try userinfo endpoint (most reliable for getting name)
    try {
      const infoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${googleToken}` },
      });
      if (infoRes.ok) {
        const info = await infoRes.json();
        console.log('=== GOOGLE USERINFO RESPONSE ===', JSON.stringify(info, null, 2));
        if (info.email) {
          payload = {
            email: info.email,
            name: info.name || info.email.split('@')[0],
            sub: info.id || info.sub,
            picture: info.picture,
          };
          console.log('=== GOOGLE LOGIN PAYLOAD ===', JSON.stringify(payload, null, 2));
        } else {
          throw new Error('No email in userinfo');
        }
      } else {
        throw new Error('userinfo failed');
      }
    } catch {
      try {
        const ticket = await googleClient.verifyIdToken({
          idToken: googleToken,
          audience: config.google.clientId,
        });
        const decoded = ticket.getPayload();
        if (!decoded || !decoded.email) throw new Error('No se pudo obtener el email');
        console.log('=== GOOGLE ID TOKEN PAYLOAD ===', JSON.stringify(decoded, null, 2));
        payload = {
          email: decoded.email,
          name: decoded.name || decoded.email.split('@')[0],
          sub: decoded.sub,
          picture: decoded.picture,
        };
      } catch {
        try {
          const response = await fetch(
            `https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=${googleToken}`,
          );
          if (!response.ok) throw new Error('Token inválido');
          const data = await response.json();
          if (!data.email) throw new Error('No se pudo obtener el email');
          console.log('=== GOOGLE TOKENINFO ===', JSON.stringify(data, null, 2));
          payload = {
            email: data.email,
            name: (data as any).name || data.email.split('@')[0],
            sub: data.sub,
          };
        } catch {
          throw new UnauthorizedException('Token de Google inválido o expirado');
        }
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
        },
      });

      if (role === 'EGRESADO') {
        await this.prisma.graduateProfile.create({
          data: {
            userId: newUser.id,
            carrera: '',
            telefono: '',
            skills: [],
          },
        });
      }

      let company = null;
      if (role === 'EMPLEADOR') {
        company = await this.prisma.company.create({
          data: {
            ruc: `TEMP-${Date.now()}`,
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

    const token = await this.signToken(user.id, user.email, user.role);
    return { user: await this.mapUser(user), token };
  }
}
