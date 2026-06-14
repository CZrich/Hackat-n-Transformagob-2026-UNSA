import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EventsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(adminId: string, data: any) {
    return this.prisma.event.create({
      data: {
        title: data.title,
        description: data.description,
        type: data.type,
        date: new Date(data.date),
        location: data.location,
        link: data.link,
        image_url: data.image_url,
        created_by: adminId,
      },
    });
  }

  async findAll() {
    return this.prisma.event.findMany({
      orderBy: { date: 'desc' },
      include: {
        admin: {
          select: { name: true, email: true }
        }
      }
    });
  }

  async remove(id: string) {
    const event = await this.prisma.event.findUnique({ where: { id } });
    if (!event) throw new NotFoundException('Evento no encontrado');

    return this.prisma.event.delete({ where: { id } });
  }
}
