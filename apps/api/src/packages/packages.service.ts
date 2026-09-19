import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class PackagesService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.package.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        description: true,
        priceKobo: true,
        validityDays: true,
        status: true,
        services: {
          select: { quantity: true, service: { select: { id: true, name: true, slug: true } } },
        },
        _count: { select: { memberships: true } },
      },
    });
  }

  async create(data: {
    name: string;
    description?: string;
    priceNaira: number;
    validityDays?: number;
    serviceSlugs: string[];
  }) {
    const name = data.name.trim();
    if (!name) throw new BadRequestException('Package name is required');
    if (data.priceNaira < 0) throw new BadRequestException('Price cannot be negative');
    if (!data.serviceSlugs.length) throw new BadRequestException('Select at least one service');

    const services = await this.prisma.service.findMany({
      where: { slug: { in: data.serviceSlugs }, isActive: true },
      select: { id: true },
    });
    if (services.length !== data.serviceSlugs.length) throw new BadRequestException('One or more services were not found');

    return this.prisma.package.create({
      data: {
        name,
        description: data.description?.trim() || undefined,
        priceKobo: Math.round(data.priceNaira * 100),
        validityDays: data.validityDays && data.validityDays > 0 ? data.validityDays : undefined,
        services: { create: services.map((service) => ({ serviceId: service.id })) },
      },
      select: {
        id: true,
        name: true,
        description: true,
        priceKobo: true,
        validityDays: true,
        status: true,
        services: { select: { quantity: true, service: { select: { id: true, name: true, slug: true } } } },
        _count: { select: { memberships: true } },
      },
    });
  }
}
