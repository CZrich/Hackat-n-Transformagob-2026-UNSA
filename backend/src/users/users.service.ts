import { Injectable, NotFoundException } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuid } from 'uuid';
import { config } from '../config';
import type { User, UserRole } from '../common/types';

const supabase = createClient(config.supabase.url, config.supabase.serviceKey);

interface CreateUserDto {
  email: string;
  name: string;
  role: UserRole;
  carrera?: string;
  telefono?: string;
}

@Injectable()
export class UsersService {
  async findByEmail(email: string): Promise<User | null> {
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single<User>();

    return data || null;
  }

  async findById(id: string): Promise<User> {
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single<User>();

    if (!data) {
      throw new NotFoundException('Usuario no encontrado');
    }
    return data;
  }

  async create(dto: CreateUserDto): Promise<User> {
    const now = new Date().toISOString();
    const user: User = {
      id: uuid(),
      email: dto.email,
      name: dto.name,
      role: dto.role,
      carrera: dto.carrera,
      telefono: dto.telefono,
      created_at: now,
    };

    const { error } = await supabase.from('users').insert(user);
    if (error) {
      throw new Error(`Error al crear usuario: ${error.message}`);
    }

    return user;
  }

  async findByCarrera(carrera: string): Promise<User[]> {
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('carrera', carrera)
      .eq('role', 'EGRESADO');

    return (data as User[]) || [];
  }
}
