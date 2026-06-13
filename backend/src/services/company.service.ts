import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface CreateCompanyDto {
  ruc: string;
  name: string;
  rubro: string;
  direccion?: string;
  horario?: string;
  userId: string;
}

@Injectable()
export class CompanyService {
  constructor(private readonly prisma: PrismaService) {}

  async findByRuc(ruc: string) {
    return this.prisma.company.findUnique({ where: { ruc } });
  }

  async findById(id: string) {
    const company = await this.prisma.company.findUnique({ where: { id } });
    if (!company) throw new NotFoundException('Empresa no encontrada');
    return company;
  }

  async create(dto: CreateCompanyDto) {
    return this.prisma.company.create({
      data: {
        ruc: dto.ruc,
        name: dto.name,
        rubro: dto.rubro,
        direccion: dto.direccion || '',
        horario: dto.horario,
        userId: dto.userId,
      },
    });
  }

  async findByUserId(userId: string) {
    return this.prisma.company.findUnique({ where: { userId } });
  }
}
