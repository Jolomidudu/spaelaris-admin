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
        photoUrl: true,
        isActive: true,
        location: { select: { id: true, name: true, slug: true, city: true } },
        _count: { select: { appointments: true } },
      },
    });
  }

  async create(data: { name: string; locationSlug: string; description?: string; photoUrl?: string }) {
    const location = await this.prisma.location.findUnique({ where: { slug: data.locationSlug } });
    if (!location || !location.isActive) throw new BadRequestException('Location was not found');

    const name = data.name.trim();
    if (!name) throw new BadRequestException('Room name is required');

    const existingRoom = await this.prisma.room.findUnique({ where: { locationId_name: { locationId: location.id, name } } });
    if (existingRoom) throw new ConflictException('A room with this name already exists at this location');

    return this.prisma.room.create({
      data: {
        locationId: location.id,
        name,
        description: data.description?.trim() || undefined,
        photoUrl: data.photoUrl?.trim() || undefined,
      },
      select: {
        id: true,
        name: true,
        description: true,
        photoUrl: true,
        isActive: true,
        location: { select: { id: true, name: true, slug: true, city: true } },
        _count: { select: { appointments: true } },
      },
    });
  }

  async update(id: string, data: {
    name?: string;
    locationSlug?: string;
    description?: string | null;
    photoUrl?: string | null;
  }) {
    const room = await this.prisma.room.findUnique({
      where: { id },
      select: { id: true, name: true, locationId: true, isActive: true },
    });
    if (!room || !room.isActive) throw new BadRequestException('Room was not found');

    const name = data.name?.trim();
    if (name !== undefined && !name) throw new BadRequestException('Room name is required');

    let locationId = room.locationId;
    if (data.locationSlug) {
      const location = await this.prisma.location.findUnique({ where: { slug: data.locationSlug } });
      if (!location || !location.isActive) throw new BadRequestException('Location was not found');
      locationId = location.id;
    }

    if ((name && name !== room.name) || locationId !== room.locationId) {
      const existingRoom = await this.prisma.room.findFirst({
        where: { id: { not: id }, locationId, name: name ?? room.name },
        select: { id: true },
      });
      if (existingRoom) throw new ConflictException('A room with this name already exists at this location');
    }

    return this.prisma.room.update({
      where: { id },
      data: {
        name,
        locationId: data.locationSlug ? locationId : undefined,
        description: data.description === undefined ? undefined : data.description?.trim() || null,
        photoUrl: data.photoUrl === undefined ? undefined : data.photoUrl?.trim() || null,
      },
      select: {
        id: true,
        name: true,
        description: true,
        photoUrl: true,
        isActive: true,
        location: { select: { id: true, name: true, slug: true, city: true } },
        _count: { select: { appointments: true } },
      },
    });
  }

  async remove(id: string) {
    const room = await this.prisma.room.findUnique({ where: { id }, select: { id: true, isActive: true } });
    if (!room || !room.isActive) throw new BadRequestException('Room was not found');

    await this.prisma.room.update({ where: { id }, data: { isActive: false } });
    return { success: true };
  }
}
