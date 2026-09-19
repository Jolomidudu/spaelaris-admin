import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class RoomsService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.room.findMany({
      where: { isActive: true },
      orderBy: [{ location: { name: 'asc' } }, { name: 'asc' }],
      select: {
        id: true,
        name: true,
        description: true,
        isActive: true,
        location: { select: { id: true, name: true, slug: true, city: true } },
        _count: { select: { appointments: true } },
      },
    });
  }

  async create(data: { name: string; locationSlug: string; description?: string }) {
    const location = await this.prisma.location.findUnique({ where: { slug: data.locationSlug } });
    if (!location || !location.isActive) throw new BadRequestException('Location was not found');

    const name = data.name.trim();
    if (!name) throw new BadRequestException('Room name is required');

    const existingRoom = await this.prisma.room.findUnique({ where: { locationId_name: { locationId: location.id, name } } });
    if (existingRoom) throw new ConflictException('A room with this name already exists at this location');

    return this.prisma.room.create({
      data: { locationId: location.id, name, description: data.description?.trim() || undefined },
      select: {
        id: true,
        name: true,
        description: true,
        isActive: true,
        location: { select: { id: true, name: true, slug: true, city: true } },
        _count: { select: { appointments: true } },
      },
    });
  }
}
