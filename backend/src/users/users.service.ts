import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { UserRole } from '../common/types';

interface CreateUserDto {
  email: string;
  name: string;
  role: UserRole;
  carrera?: string;
  telefono?: string;
}

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
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
}
