import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class ServicesService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.service.findMany({
      where: { isActive: true },
      orderBy: [{ category: { sortOrder: 'asc' } }, { name: 'asc' }],
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        durationMinutes: true,
        priceKobo: true,
        isActive: true,
        category: { select: { id: true, name: true, slug: true } },
      },
    });
  }

  async createCategory(data: { name: string; description?: string }) {
    const name = data.name.trim();
    if (!name) throw new BadRequestException('Category name is required');

    const slug = `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`;

    const existing = await this.prisma.serviceCategory.findUnique({ where: { slug } });
    if (existing) {
      throw new BadRequestException('A category with this name already exists');
    }

    return this.prisma.serviceCategory.create({
      data: {
        name,
        slug,
        description: data.description?.trim() || undefined,
      },
      select: { id: true, name: true, slug: true, description: true },
    });
  }

  async create(data: {
    name: string;
    categoryId: string;
    description?: string;
    durationMinutes: number;
    priceNaira: number;
  }) {
    const category = await this.prisma.serviceCategory.findUnique({
      where: { id: data.categoryId },
    });

    if (!category || !category.isActive) {
      throw new BadRequestException('Service category was not found');
    }

    const name = data.name.trim();
    if (!name) throw new BadRequestException('Service name is required');
    if (data.durationMinutes < 1) throw new BadRequestException('Duration must be at least one minute');
    if (data.priceNaira < 0) throw new BadRequestException('Price cannot be negative');

    const slug = `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}-${Date.now()}`;

    return this.prisma.service.create({
      data: {
        name,
        slug,
        categoryId: category.id,
        description: data.description?.trim() || undefined,
        durationMinutes: data.durationMinutes,
        priceKobo: Math.round(data.priceNaira * 100),
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        durationMinutes: true,
        priceKobo: true,
        isActive: true,
        category: { select: { id: true, name: true, slug: true } },
      },
    });
  }

  categories() {
    return this.prisma.serviceCategory.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      select: { id: true, name: true, slug: true },
    });
  }
}
