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

    const isVerified = company.es_verificada || false;
    const status: JobStatus = isVerified ? 'APPROVED' : 'PENDING';

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
        status: status,
        created_by_id: userId,
      },
    });

    if (status === 'APPROVED') {
      await this.notificationService.notifyCandidates(job);
    }
    return job;
  }

  async findMatched(userId: string, carrera: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { skills: true }
    });

    const userSkills = (user?.skills || []).map(s => s.toLowerCase());

    const jobs = await this.prisma.job.findMany({
      where: { carrera_destino: carrera, status: 'APPROVED' },
      orderBy: { creado_en: 'desc' },
      include: {
        applications: {
          where: { userId }
        }
      }
    });

    // Calculate match score based on overlapping skills
    return jobs.map(job => {
      const jobCompetencias = (job.competencias || []).map(s => s.toLowerCase());
      let matchCount = 0;
      for (const skill of userSkills) {
        if (jobCompetencias.includes(skill)) {
          matchCount++;
        }
      }
      return { ...job, matchScore: matchCount };
    }).sort((a, b) => b.matchScore - a.matchScore);
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
        include: {
          applications: {
            include: { user: true }
          }
        }
      });
    }
    return this.prisma.job.findMany({
      where: { created_by_id: userId },
      orderBy: { creado_en: 'desc' },
      take: 50,
      include: {
        applications: {
          include: { user: true }
        }
      }
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

  async applyJob(jobId: string, userId: string) {
    const existing = await this.prisma.application.findUnique({
      where: {
        jobId_userId: { jobId, userId }
      }
    });
    if (existing) {
      throw new BadRequestException('Ya has postulado a esta oferta');
    }

    return this.prisma.application.create({
      data: {
        jobId,
        userId,
        status: 'PENDING',
      }
    });
  }
}
