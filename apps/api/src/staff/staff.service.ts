import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
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
        role: 'THERAPIST',
        status: 'ACTIVE',
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