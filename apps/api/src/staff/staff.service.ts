import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class StaffService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    locationSlug: string;
    serviceSlugs: string[];
    role?: UserRole;
    initialPassword?: string;
  }) {
    const location = await this.prisma.location.findUnique({ where: { slug: data.locationSlug } });
    if (!location) {
      throw new BadRequestException('Location not found');
    }

    const services = await this.prisma.service.findMany({
      where: { slug: { in: data.serviceSlugs }, isActive: true },
      select: { id: true },
    });

    if (services.length !== data.serviceSlugs.length) {
      throw new BadRequestException('One or more services were not found');
    }

    const role = data.role ?? UserRole.THERAPIST;
    if (role !== UserRole.THERAPIST && !data.initialPassword) {
      throw new BadRequestException('An initial password is required for admin staff accounts');
    }

    const existingUser = await this.prisma.user.findUnique({ where: { email: data.email.trim().toLowerCase() } });
    if (existingUser) {
      throw new ConflictException('A user with this email already exists');
    }

    const user = await this.prisma.user.create({
      data: {
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        email: data.email.trim().toLowerCase(),
        phone: data.phone?.trim() || undefined,
        role,
        status: 'ACTIVE',
        passwordHash: data.initialPassword
          ? await bcrypt.hash(data.initialPassword, 12)
          : undefined,
        staffProfile: {
          create: {
            locationId: location.id,
            services: {
              create: services.map((service) => ({ serviceId: service.id })),
            },
          },
        },
      },
      select: { id: true, firstName: true, lastName: true, email: true },
    });

    return user;
  }

  async updateAccess(id: string, data: { role: UserRole; password: string }) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new BadRequestException('Staff user was not found');

    return this.prisma.user.update({
      where: { id },
      data: {
        role: data.role,
        status: 'ACTIVE',
        passwordHash: await bcrypt.hash(data.password, 12),
      },
      select: { id: true, firstName: true, lastName: true, email: true, role: true, status: true },
    });
  }

  async updateAvailability(
    staffProfileId: string,
    availability: Array<{ dayOfWeek: number; startTime: string; endTime: string }>,
  ) {
    const profile = await this.prisma.staffProfile.findUnique({
      where: { id: staffProfileId },
      select: { id: true, user: { select: { role: true } } },
    });
    if (!profile || profile.user.role !== UserRole.THERAPIST) {
      throw new BadRequestException('Therapist profile was not found');
    }

    const byDay = new Map<number, Array<{ start: number; end: number }>>();
    for (const entry of availability) {
      const start = Number(entry.startTime.slice(0, 2)) * 60 + Number(entry.startTime.slice(3));
      const end = Number(entry.endTime.slice(0, 2)) * 60 + Number(entry.endTime.slice(3));
      if (end <= start) throw new BadRequestException('Availability end time must be later than start time');
      const dayEntries = byDay.get(entry.dayOfWeek) ?? [];
      if (dayEntries.some((range) => start < range.end && end > range.start)) {
        throw new BadRequestException('Availability periods cannot overlap on the same day');
      }
      dayEntries.push({ start, end });
      byDay.set(entry.dayOfWeek, dayEntries);
    }

    await this.prisma.$transaction(async (transaction) => {
      await transaction.staffAvailability.deleteMany({ where: { staffProfileId } });
      if (availability.length > 0) {
        await transaction.staffAvailability.createMany({
          data: availability.map((entry) => ({ staffProfileId, ...entry })),
        });
      }
    });

    return this.prisma.staffAvailability.findMany({
      where: { staffProfileId },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
      select: { id: true, dayOfWeek: true, startTime: true, endTime: true },
    });
  }

  list() {
    return this.prisma.staffProfile.findMany({
      where: {
        user: {
          status: 'ACTIVE',
        },
      },
      orderBy: [
        { location: { name: 'asc' } },
        { user: { lastName: 'asc' } },
      ],
      select: {
        id: true,
        bio: true,
        photoUrl: true,
        isBookable: true,
        availability: {
          orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
          select: { id: true, dayOfWeek: true, startTime: true, endTime: true },
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            role: true,
            status: true,
          },
        },
        location: {
          select: {
            id: true,
            name: true,
            city: true,
          },
        },
        services: {
          select: {
            service: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });
  }
}