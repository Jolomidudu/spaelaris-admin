import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}

  catalog() {
    return this.prisma.serviceCategory.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        number: true,
        shortName: true,
        imageUrl: true,
        services: {
          where: { isActive: true },
          orderBy: { name: 'asc' },
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            details: true,
            benefits: true,
            includes: true,
            durationMinutes: true,
            priceKobo: true,
            photoUrl: true,
          },
        },
      },
    });
  }

  async therapists() {
    const profiles = await this.prisma.staffProfile.findMany({
      where: {
        isPubliclyListed: true,
        isBookable: true,
        publicSlug: { not: null },
        user: { status: 'ACTIVE', role: 'THERAPIST' },
      },
      orderBy: [{ location: { name: 'asc' } }, { user: { lastName: 'asc' } }],
      select: {
        id: true,
        publicSlug: true,
        displayTitle: true,
        bio: true,
        photoUrl: true,
        rating: true,
        reviewCount: true,
        completedAppointments: true,
        clientsServed: true,
        languages: true,
        location: { select: { name: true, slug: true, city: true } },
        user: { select: { firstName: true, lastName: true } },
        services: {
          where: { service: { isActive: true, category: { isActive: true } } },
          select: {
            service: {
              select: {
                id: true,
                name: true,
                slug: true,
                durationMinutes: true,
                priceKobo: true,
              },
            },
          },
        },
      },
    });

    return profiles.map(({ user, location, services, displayTitle, publicSlug, ...profile }) => ({
      ...profile,
      publicSlug: publicSlug!,
      displayTitle,
      name: `${user.firstName} ${user.lastName}`,
      role: displayTitle ?? 'Therapist',
      city: `${location.city}, Nigeria`,
      location,
      services: services.map(({ service }) => service),
    }));
  }
}
