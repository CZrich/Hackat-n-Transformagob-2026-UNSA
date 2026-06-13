import { Injectable, NotFoundException } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuid } from 'uuid';
import { config } from '../config';
import type { Company } from '../common/types';

const supabase = createClient(config.supabase.url, config.supabase.serviceKey);

interface CreateCompanyDto {
  ruc: string;
  name: string;
  rubro: string;
}

@Injectable()
export class CompaniesService {
  async findByRuc(ruc: string): Promise<Company | null> {
    const { data } = await supabase
      .from('companies')
      .select('*')
      .eq('ruc', ruc)
      .single<Company>();

    return data || null;
  }

  async findById(id: string): Promise<Company> {
    const { data } = await supabase
      .from('companies')
      .select('*')
      .eq('id', id)
      .single<Company>();

    if (!data) {
      throw new NotFoundException('Empresa no encontrada');
    }
    return data;
  }

  async create(dto: CreateCompanyDto): Promise<Company> {
    const company: Company = {
      id: uuid(),
      ruc: dto.ruc,
      name: dto.name,
      rubro: dto.rubro,
      es_baneada: false,
    };

    const { error } = await supabase.from('companies').insert(company);
    if (error) {
      throw new Error(`Error al crear empresa: ${error.message}`);
    }

    return company;
  }

  async findByUserId(userId: string): Promise<Company | null> {
    const { data } = await supabase
      .from('companies')
      .select('*')
      .eq('user_id', userId)
      .single<Company>();

    return data || null;
  }
}
