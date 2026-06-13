import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CompaniesService } from '../companies/companies.service';
import { NotificationService } from '../notification/notification.service';
import type { JobStatus, UserRole } from '../common/types';

interface CreateJobDto {
  ruc: string;
  title: string;
  description?: string;
  carrera_destino: string;
  salario_min: number;
  salario_max: number;
  requisitos: string;
}

@Injectable()
export class JobsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly companiesService: CompaniesService,
    private readonly notificationService: NotificationService,
  ) {}

  async create(dto: CreateJobDto, userId: string) {
    let company = await this.companiesService.findByRuc(dto.ruc);
    if (!company) {
      company = await this.companiesService.create({
        ruc: dto.ruc,
        name: `Empresa RUC ${dto.ruc}`,
        rubro: 'No especificado',
      });
    }

    return this.prisma.job.create({
      data: {
        title: dto.title,
        description: dto.description,
        company_id: company.id,
        company_name: company.name,
        carrera_destino: dto.carrera_destino,
        salario_min: dto.salario_min,
        salario_max: dto.salario_max,
        requisitos: dto.requisitos,
        created_by_id: userId,
      },
    });
  }

  async findByCareer(carrera: string) {
    return this.prisma.job.findMany({
      where: { carrera_destino: carrera, status: 'APPROVED' },
      orderBy: { creado_en: 'desc' },
    });
  }

  async findPending() {
    return this.prisma.job.findMany({
      where: { status: 'PENDING' },
      orderBy: { creado_en: 'desc' },
    });
  }

  async findByCompanyUser(userId: string) {
    return this.prisma.job.findMany({
      where: { created_by_id: userId },
      orderBy: { creado_en: 'desc' },
      take: 50,
    });
  }

  async updateStatus(
    id: string,
    newStatus: JobStatus,
    userId: string,
    userRole: UserRole,
  ) {
    if (userRole !== 'ADMIN') {
      throw new ForbiddenException('Solo el administrador puede moderar ofertas');
    }

    const job = await this.prisma.job.findUnique({ where: { id } });
    if (!job) {
      throw new NotFoundException('Oferta no encontrada');
    }

    const updated = await this.prisma.job.update({
      where: { id },
      data: { status: newStatus },
    });

    if (newStatus === 'APPROVED') {
      await this.notificationService.notifyCandidates(updated);
    }

    return updated;
  }
}
