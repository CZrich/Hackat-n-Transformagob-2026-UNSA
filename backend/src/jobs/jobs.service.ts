import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuid } from 'uuid';
import { config } from '../config';
import { UsersService } from '../users/users.service';
import { CompaniesService } from '../companies/companies.service';
import { NotificationService } from '../notification/notification.service';
import type { Job, JobStatus, UserRole } from '../common/types';

const supabase = createClient(config.supabase.url, config.supabase.serviceKey);

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
    private readonly usersService: UsersService,
    private readonly companiesService: CompaniesService,
    private readonly notificationService: NotificationService,
  ) {}

  async create(dto: CreateJobDto, userId: string): Promise<Job> {
    let company = await this.companiesService.findByRuc(dto.ruc);
    if (!company) {
      company = await this.companiesService.create({
        ruc: dto.ruc,
        name: `Empresa RUC ${dto.ruc}`,
        rubro: 'No especificado',
      });
    }

    const now = new Date().toISOString();
    const job: Job = {
      id: uuid(),
      title: dto.title,
      description: dto.description,
      company_id: company.id,
      company_name: company.name,
      carrera_destino: dto.carrera_destino,
      salario_min: dto.salario_min,
      salario_max: dto.salario_max,
      requisitos: dto.requisitos,
      status: 'PENDING',
      creado_en: now,
    };

    const { error } = await supabase.from('jobs').insert(job);
    if (error) {
      throw new Error(`Error al crear oferta: ${error.message}`);
    }

    return job;
  }

  async findByCareer(carrera: string): Promise<Job[]> {
    const { data } = await supabase
      .from('jobs')
      .select('*')
      .eq('carrera_destino', carrera)
      .eq('status', 'APPROVED')
      .order('creado_en', { ascending: false });

    return (data as Job[]) || [];
  }

  async findPending(): Promise<Job[]> {
    const { data } = await supabase
      .from('jobs')
      .select('*')
      .eq('status', 'PENDING')
      .order('creado_en', { ascending: false });

    return (data as Job[]) || [];
  }

  async findByCompanyUser(userId: string): Promise<Job[]> {
    const user = await this.usersService.findById(userId);
    const company = await this.companiesService.findByUserId(userId);

    if (company) {
      const { data } = await supabase
        .from('jobs')
        .select('*')
        .eq('company_id', company.id)
        .order('creado_en', { ascending: false });

      return (data as Job[]) || [];
    }

    const { data } = await supabase
      .from('jobs')
      .select('*')
      .order('creado_en', { ascending: false })
      .limit(50);

    return (data as Job[]) || [];
  }

  async updateStatus(
    id: string,
    newStatus: JobStatus,
    userId: string,
    userRole: UserRole,
  ): Promise<Job> {
    if (userRole !== 'ADMIN') {
      throw new ForbiddenException('Solo el administrador puede moderar ofertas');
    }

    const { data: job } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', id)
      .single<Job>();

    if (!job) {
      throw new NotFoundException('Oferta no encontrada');
    }

    const { error, data: updated } = await supabase
      .from('jobs')
      .update({ status: newStatus })
      .eq('id', id)
      .select()
      .single<Job>();

    if (error) {
      throw new Error(`Error al actualizar oferta: ${error.message}`);
    }

    if (newStatus === 'APPROVED') {
      await this.notificationService.notifyCandidates(updated!);
    }

    return updated!;
  }
}
