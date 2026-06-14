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
      include: { company: true, profile: true },
    });
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { company: true, profile: true },
    });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }
    return user;
  }

  async create(dto: CreateUserDto) {
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        name: dto.name,
        role: dto.role,
      },
    });

    if (dto.role === 'EGRESADO') {
      await this.prisma.graduateProfile.create({
        data: {
          userId: user.id,
          carrera: dto.carrera || '',
          telefono: dto.telefono || '',
          skills: dto.skills || [],
        },
      });
    }

    return user;
  }

  async findByCarrera(carrera: string) {
    return this.prisma.graduateProfile.findMany({
      where: { carrera },
      include: { user: true },
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
    direccion?: string;
    horario?: string;
    contacto_telefono?: string;
    contacto_email?: string;
    cv_name?: string;
    cv_url?: string;
    bio?: string;
    linkedin_url?: string;
    portfolio_url?: string;
    education?: string;
    work_experience?: string;
    certifications?: string;
    languages?: string;
  }) {
    const user = await this.findById(userId);
    
    if (data.ruc && data.ruc !== user.company?.ruc) {
      const existing = await this.prisma.company.findUnique({ where: { ruc: data.ruc } });
      if (existing) throw new ConflictException('El RUC ya está registrado');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.password && { password: data.password }),
      },
    });

    if (user.role === 'EMPLEADOR') {
      await this.prisma.company.upsert({
        where: { userId },
        update: {
          ...(data.name && { name: data.name }),
          ...(data.ruc && { ruc: data.ruc }),
          ...(data.rubro && { rubro: data.rubro }),
          ...(data.direccion !== undefined ? { direccion: data.direccion } : {}),
          ...(data.horario !== undefined ? { horario: data.horario } : {}),
          ...(data.contacto_telefono !== undefined ? { contacto_telefono: data.contacto_telefono } : {}),
          ...(data.contacto_email !== undefined ? { contacto_email: data.contacto_email } : {}),
        },
        create: {
          ruc: data.ruc || `TEMP-${Date.now()}`,
          name: data.name || user.name,
          rubro: data.rubro || 'No especificado',
          direccion: data.direccion || '',
          horario: data.horario || '',
          contacto_telefono: data.contacto_telefono || '',
          contacto_email: data.contacto_email || '',
          userId,
        },
      });
    }

    if (user.role === 'EGRESADO') {
      await this.prisma.graduateProfile.upsert({
        where: { userId },
        update: {
          ...(data.carrera !== undefined ? { carrera: data.carrera } : {}),
          ...(data.telefono !== undefined ? { telefono: data.telefono } : {}),
          ...(data.skills !== undefined ? { skills: data.skills } : {}),
          ...(data.cv_name !== undefined ? { cv_name: data.cv_name } : {}),
          ...(data.cv_url !== undefined ? { cv_url: data.cv_url } : {}),
          ...(data.bio !== undefined ? { bio: data.bio } : {}),
          ...(data.linkedin_url !== undefined ? { linkedin_url: data.linkedin_url } : {}),
          ...(data.portfolio_url !== undefined ? { portfolio_url: data.portfolio_url } : {}),
          ...(data.education !== undefined ? { education: data.education } : {}),
          ...(data.work_experience !== undefined ? { experience: data.work_experience } : {}),
          ...(data.certifications !== undefined ? { certifications: data.certifications } : {}),
          ...(data.languages !== undefined ? { languages: data.languages } : {}),
        },
        create: {
          userId,
          carrera: data.carrera || '',
          telefono: data.telefono || '',
          skills: data.skills || [],
          cv_name: data.cv_name || '',
          cv_url: data.cv_url || '',
          bio: data.bio || '',
          linkedin_url: data.linkedin_url || '',
          portfolio_url: data.portfolio_url || '',
          education: data.education || '',
          experience: data.work_experience || '',
          certifications: data.certifications || '',
          languages: data.languages || '',
        },
      });
    }

    return this.prisma.user.findUnique({
      where: { id: userId },
      include: { company: true, profile: true },
    });
  }

  async updateGraduateProfile(userId: string, data: {
    summary?: string;
    carrera?: string;
    telefono?: string;
    skills?: string[];
    cv_name?: string;
    cv_url?: string;
    bio?: string;
    education?: string;
    experience?: string;
    certifications?: string;
    languages?: string;
    linkedin_url?: string;
    portfolio_url?: string;
  }) {
    return this.prisma.graduateProfile.upsert({
      where: { userId },
      update: {
        ...(data.carrera !== undefined ? { carrera: data.carrera } : {}),
        ...(data.telefono !== undefined ? { telefono: data.telefono } : {}),
        ...(data.skills !== undefined ? { skills: data.skills } : {}),
        ...(data.cv_name !== undefined ? { cv_name: data.cv_name } : {}),
        ...(data.cv_url !== undefined ? { cv_url: data.cv_url } : {}),
        ...(data.bio !== undefined ? { bio: data.bio } : {}),
        ...(data.summary !== undefined ? { summary: data.summary } : {}),
        ...(data.education !== undefined ? { education: data.education } : {}),
        ...(data.experience !== undefined ? { experience: data.experience } : {}),
        ...(data.certifications !== undefined ? { certifications: data.certifications } : {}),
        ...(data.languages !== undefined ? { languages: data.languages } : {}),
        ...(data.linkedin_url !== undefined ? { linkedin_url: data.linkedin_url } : {}),
        ...(data.portfolio_url !== undefined ? { portfolio_url: data.portfolio_url } : {}),
      },
      create: {
        userId,
        carrera: data.carrera || '',
        telefono: data.telefono || '',
        skills: data.skills || [],
        cv_name: data.cv_name || '',
        cv_url: data.cv_url || '',
        bio: data.bio || '',
        summary: data.summary || '',
        education: data.education || '',
        experience: data.experience || '',
        certifications: data.certifications || '',
        languages: data.languages || '',
        linkedin_url: data.linkedin_url || '',
        portfolio_url: data.portfolio_url || '',
      },
    });
  }

  async getGraduateProfile(userId: string) {
    return this.prisma.graduateProfile.findUnique({ where: { userId } });
  }
}
