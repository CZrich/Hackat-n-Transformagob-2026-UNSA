import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AiService {
  constructor(private readonly prisma: PrismaService) {}

  async simulateInterview(jobId: string, userId: string) {
    const job = await this.prisma.job.findUnique({ where: { id: jobId } });
    if (!job) {
      throw new NotFoundException('Oferta no encontrada');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const userSkills = user.skills || [];
    const requiredSkills = job.competencias || [];
    const missingSkills = requiredSkills.filter(
      (req) => !userSkills.some((us) => us.toLowerCase() === req.toLowerCase()),
    );
    const matchedSkills = requiredSkills.filter((req) =>
      userSkills.some((us) => us.toLowerCase() === req.toLowerCase()),
    );

    const questions = this.generateQuestions(job, user, missingSkills);

    return {
      jobTitle: job.title,
      companyName: job.company_name,
      carrera: user.carrera,
      match: {
        total: requiredSkills.length,
        matched: matchedSkills.length,
        missing: missingSkills.length,
        percentage: requiredSkills.length > 0
          ? Math.round((matchedSkills.length / requiredSkills.length) * 100)
          : 100,
        matchedSkills,
        missingSkills,
      },
      feedback: missingSkills.length > 0
        ? `Te recomendamos prepararte en: ${missingSkills.join(', ')}. Estas habilidades son clave para el puesto.`
        : '¡Tienes todas las competencias requeridas! Buen perfil para el puesto.',
      interview: questions,
    };
  }

  private generateQuestions(job: any, _user: any, missingSkills: string[]) {
    const baseQuestions = [
      {
        id: 'q1',
        pregunta: `¿Podrías explicar cómo tu experiencia en ${job.carrera_destino} se alinea con los requisitos del puesto "${job.title}"?`,
        tipo: 'general',
        consejo: 'Resalta tus logros cuantificables y proyectos relevantes.',
      },
      {
        id: 'q2',
        pregunta: `Describe una situación donde aplicaste conocimientos de ${job.carrera_destino} para resolver un problema complejo.`,
        tipo: 'comportamental',
        consejo: 'Usa la metodología STAR (Situación, Tarea, Acción, Resultado).',
      },
      {
        id: 'q3',
        pregunta: `El salario del puesto es de S/ ${job.salario_min} - S/ ${job.salario_max}. ¿Cómo negociarías tu remuneración basándote en tus competencias?`,
        tipo: 'negociacion',
        consejo: 'Investiga el mercado salarial para tu perfil antes de responder.',
      },
    ];

    const skillQuestions = missingSkills.slice(0, 2).map((skill, i) => ({
      id: `q_skill_${i}`,
      pregunta: `Notamos que no tienes "${skill}" registrada en tu perfil. ¿Qué experiencia o formación tienes relacionada con esta competencia?`,
      tipo: 'tecnica',
      consejo: `Si no tienes experiencia directa, menciona cursos, certificaciones o proyectos personales donde hayas usado ${skill}.`,
    }));

    return [...baseQuestions, ...skillQuestions];
  }
}
