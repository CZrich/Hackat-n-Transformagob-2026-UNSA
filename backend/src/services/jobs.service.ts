import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CompanyService } from './company.service';
import { NotificationService } from '../notification/notification.service';
import type { JobStatus, UserRole } from '../common/types';

export interface CreateJobDto {
  ruc: string;
  title: string;
  description?: string;
  carrera_destino: string;
  salario_min: number;
  salario_max: number;
  requisitos: string;
  funciones?: string;
  lugar?: string;
  horario?: string;
  vacantes?: number;
  fecha_inicio?: string;
  fecha_fin?: string;
  competencias?: string[];
}

@Injectable()
export class JobsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly companyService: CompanyService,
    private readonly notificationService: NotificationService,
  ) {}

  async create(dto: CreateJobDto, userId: string) {
    let company = await this.companyService.findByRuc(dto.ruc);
    if (!company) {
      company = await this.companyService.create({
        ruc: dto.ruc,
        name: `Empresa RUC ${dto.ruc}`,
        rubro: 'No especificado',
        direccion: '',
        userId,
      });
    }

    if (!company.es_verificada) {
      throw new BadRequestException(
        'Tu empresa no está verificada por ODEEG. No puedes publicar ofertas hasta que un administrador verifique tu RUC.',
      );
    }

    const now = new Date();
    const fechaInicio = dto.fecha_inicio ? new Date(dto.fecha_inicio) : now;
    const fechaFin = dto.fecha_fin ? new Date(dto.fecha_fin) : new Date(now.getTime() + 30 * 86400000);

    const job = await this.prisma.job.create({
      data: {
        title: dto.title,
        description: dto.description,
        company_id: company.id,
        company_name: company.name,
        carrera_destino: dto.carrera_destino,
        salario_min: dto.salario_min,
        salario_max: dto.salario_max,
        requisitos: dto.requisitos,
        funciones: dto.funciones || '',
        lugar: dto.lugar || '',
        horario: dto.horario || '',
        cantidad_req: dto.vacantes || 1,
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
        perfil: dto.requisitos,
        competencias: dto.competencias || [],
        status: 'APPROVED',
        created_by_id: userId,
      },
    });

    await this.notificationService.notifyCandidates(job);
    return job;
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
    const company = await this.prisma.company.findUnique({ where: { userId } });
    if (company) {
      return this.prisma.job.findMany({
        where: { company_id: company.id },
        orderBy: { creado_en: 'desc' },
        take: 50,
      });
    }
    return this.prisma.job.findMany({
      where: { created_by_id: userId },
      orderBy: { creado_en: 'desc' },
      take: 50,
    });
  }

  async updateStatus(id: string, newStatus: JobStatus, userId: string, userRole: UserRole) {
    if (userRole !== 'ADMIN') {
      throw new ForbiddenException('Solo el administrador puede moderar ofertas');
    }

    const job = await this.prisma.job.findUnique({ where: { id } });
    if (!job) throw new NotFoundException('Oferta no encontrada');

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
