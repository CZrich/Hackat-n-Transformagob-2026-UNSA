import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationService {
  constructor(private readonly prisma: PrismaService) {}

  async notifyCandidates(job: { carrera_destino: string; salario_min: number; salario_max: number }) {
    const candidates = await this.prisma.user.findMany({
      where: { carrera: job.carrera_destino, role: 'EGRESADO' },
    });

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

  async notifyCompanyVerified(user: { name?: string | null; telefono?: string | null }) {
    console.log(
      `[WhatsApp API] Enviando alerta a ${user.telefono || 'N/D'}: ` +
        `¡Felicidades ${user.name}! Tu empresa ha sido VERIFICADA por ODEEG. ` +
        `Ya puedes publicar ofertas laborales en CONECTA-UNSA.`,
    );
  }
}
