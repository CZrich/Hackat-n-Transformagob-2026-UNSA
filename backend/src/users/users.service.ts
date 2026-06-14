import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { UserRole } from '../common/types';

interface CreateUserDto {
  email: string;
  name: string;
  role: UserRole;
  carrera?: string;
  telefono?: string;
  password?: string;
  skills?: string[];
}

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      include: { company: true },
    });
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { company: true },
    });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }
    return user;
  }

  async create(dto: CreateUserDto) {
    return this.prisma.user.create({
      data: {
        email: dto.email,
        name: dto.name,
        role: dto.role,
        carrera: dto.carrera,
        telefono: dto.telefono,
      },
    });
  }

  async findByCarrera(carrera: string) {
    return this.prisma.user.findMany({
      where: { carrera, role: 'EGRESADO' },
    });
  }

  async updateProfile(userId: string, data: {
    name?: string;
    carrera?: string;
    telefono?: string;
    skills?: string[];
    password?: string;
    ruc?: string;
    rubro?: string;
    cv_name?: string;
    cv_url?: string;
    bio?: string;
  }) {
    const user = await this.findById(userId);
    
    // Validate if changing RUC that it's not taken
    if (data.ruc && data.ruc !== user.company?.ruc) {
      const existing = await this.prisma.company.findUnique({ where: { ruc: data.ruc } });
      if (existing) throw new ConflictException('El RUC ya está registrado');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.carrera && { carrera: data.carrera }),
        ...(data.telefono && { telefono: data.telefono }),
        ...(data.skills && { skills: data.skills }),
        ...(data.password && { password: data.password }),
        ...(data.cv_name !== undefined && { cv_name: data.cv_name }),
        ...(data.cv_url !== undefined && { cv_url: data.cv_url }),
        ...(data.bio !== undefined && { bio: data.bio }),
      },
    });

    if (user.role === 'EMPLEADOR') {
      await this.prisma.company.upsert({
        where: { userId: userId },
        update: {
          ...(data.name && { name: data.name }),
          ...(data.ruc && { ruc: data.ruc }),
          ...(data.rubro && { rubro: data.rubro }),
        },
        create: {
          ruc: data.ruc || `TEMP-${Date.now()}`,
          name: data.name || user.name,
          rubro: data.rubro || 'No especificado',
          direccion: '',
          userId: userId,
        },
      });
    }

    return updatedUser;
  }
}
