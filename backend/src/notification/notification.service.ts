import { Injectable } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';
import { config } from '../config';
import type { Job, User } from '../common/types';

const supabase = createClient(config.supabase.url, config.supabase.serviceKey);

@Injectable()
export class NotificationService {
  async notifyCandidates(job: Job): Promise<void> {
    const { data: users } = await supabase
      .from('users')
      .select('*')
      .eq('carrera', job.carrera_destino)
      .eq('role', 'EGRESADO');

    const candidates = (users as User[]) || [];

    for (const user of candidates) {
      console.log(
        `[WhatsApp API] Enviando alerta a ${user.telefono}: ` +
          `Nueva oferta de trabajo para la carrera de ${job.carrera_destino} ` +
          `con sueldo S/ ${job.salario_min} - S/ ${job.salario_max}`,
      );
    }

    if (candidates.length === 0) {
      console.log(
        `[WhatsApp API] No se encontraron candidatos para la carrera ${job.carrera_destino}`,
      );
    }
  }
}
