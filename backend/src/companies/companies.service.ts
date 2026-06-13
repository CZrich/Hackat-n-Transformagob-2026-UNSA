import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface CreateCompanyDto {
  ruc: string;
  name: string;
  rubro: string;
}

@Injectable()
export class CompaniesService {
  constructor(private readonly prisma: PrismaService) {}

  async findByRuc(ruc: string) {
    return this.prisma.company.findUnique({ where: { ruc } });
  }

  async findById(id: string) {
    const company = await this.prisma.company.findUnique({ where: { id } });
    if (!company) {
      throw new NotFoundException('Empresa no encontrada');
    }
    return company;
  }

  async create(dto: CreateCompanyDto) {
    return this.prisma.company.create({
      data: {
        ruc: dto.ruc,
        name: dto.name,
        rubro: dto.rubro,
      },
    });
  }
}
