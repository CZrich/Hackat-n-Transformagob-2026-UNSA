import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notification: NotificationService,
  ) {}

  async listCompanies() {
    return this.prisma.company.findMany({
      include: { user: { select: { email: true, telefono: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async verifyCompany(companyId: string) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      include: { user: true },
    });

    if (!company) {
      throw new NotFoundException('Empresa no encontrada');
    }

    const updated = await this.prisma.company.update({
      where: { id: companyId },
      data: { es_verificada: true },
    });

    await this.prisma.job.updateMany({
      where: { company_id: companyId, status: 'PENDING' },
      data: { status: 'APPROVED' },
    });

    await this.notification.notifyCompanyVerified(company.user);

    return updated;
  }
}
