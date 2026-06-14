import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RatingsService {
  constructor(private readonly prisma: PrismaService) {}

  async rateCompany(companyId: string, userId: string, score: number, comment?: string) {
    if (score < 1 || score > 5) {
      throw new BadRequestException('La calificación debe ser entre 1 y 5');
    }

    const company = await this.prisma.company.findUnique({ where: { id: companyId } });
    if (!company) throw new NotFoundException('Empresa no encontrada');

    const existing = await this.prisma.companyRating.findUnique({
      where: { companyId_userId: { companyId, userId } }
    });

    let rating;
    if (existing) {
      rating = await this.prisma.companyRating.update({
        where: { id: existing.id },
        data: { score, comment },
      });
    } else {
      rating = await this.prisma.companyRating.create({
        data: { companyId, userId, score, comment },
      });
    }

    const allRatings = await this.prisma.companyRating.findMany({
      where: { companyId },
      select: { score: true }
    });

    const promedio = allRatings.reduce((sum, r) => sum + r.score, 0) / allRatings.length;

    await this.prisma.company.update({
      where: { id: companyId },
      data: {
        rating_promedio: Math.round(promedio * 10) / 10,
        total_votos: allRatings.length,
      },
    });

    return rating;
  }

  async getCompanyRating(companyId: string) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      select: { rating_promedio: true, total_votos: true, id: true }
    });
    if (!company) throw new NotFoundException('Empresa no encontrada');
    return company;
  }

  async getUserRatings(userId: string) {
    return this.prisma.companyRating.findMany({
      where: { userId },
      include: { company: { select: { name: true, ruc: true } } }
    });
  }
}
