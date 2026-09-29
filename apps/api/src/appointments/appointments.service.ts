import { BadRequestException, Injectable } from '@nestjs/common';
import { AppointmentStatus } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';

const VALID_APPOINTMENT_TRANSITIONS: Record<AppointmentStatus, AppointmentStatus[]> = {
  [AppointmentStatus.PENDING]: [
    AppointmentStatus.CONFIRMED,
    AppointmentStatus.CANCELLED,
    AppointmentStatus.NO_SHOW,
  ],
  [AppointmentStatus.CONFIRMED]: [
    AppointmentStatus.CHECKED_IN,
    AppointmentStatus.CANCELLED,
    AppointmentStatus.NO_SHOW,
  ],
  [AppointmentStatus.CHECKED_IN]: [
    AppointmentStatus.IN_SERVICE,
    AppointmentStatus.CANCELLED,
    AppointmentStatus.NO_SHOW,
  ],
  [AppointmentStatus.IN_SERVICE]: [
    AppointmentStatus.COMPLETED,
    AppointmentStatus.CANCELLED,
  ],
  [AppointmentStatus.COMPLETED]: [],
  [AppointmentStatus.CANCELLED]: [],
  [AppointmentStatus.NO_SHOW]: [],
};

@Injectable()
export class AppointmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async update(id: string, data: {
    startsAt?: string;
    endsAt?: string;
    status?: AppointmentStatus;
    notes?: string;
  }) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
      select: { startsAt: true, endsAt: true, status: true },
    });

    if (!appointment) throw new BadRequestException('Appointment was not found');

    if (data.status && !VALID_APPOINTMENT_TRANSITIONS[appointment.status]?.includes(data.status)) {
      throw new BadRequestException(
        `Appointment status cannot move from ${appointment.status} to ${data.status}`,
      );
    }

    const startsAt = data.startsAt ? new Date(data.startsAt) : appointment.startsAt;
    const endsAt = data.endsAt ? new Date(data.endsAt) : appointment.endsAt;
    if (endsAt <= startsAt) throw new BadRequestException('Appointment end must be after its start');

    return this.prisma.appointment.update({
      where: { id },
      data: {
        startsAt: data.startsAt ? startsAt : undefined,
        endsAt: data.endsAt ? endsAt : undefined,
        status: data.status,
        notes: data.notes?.trim() || undefined,
      },
      select: { id: true, startsAt: true, endsAt: true, status: true },
    });
  }

  async create(data: {
    customerPhone: string;
    customerFirstName: string;
    customerLastName: string;
    customerNote?: string;
    serviceSlug: string;
    locationSlug: string;
    therapistEmail?: string;
    therapistProfileId?: string;
    roomName?: string;
    startsAt: string;
    endsAt: string;
    status?: AppointmentStatus;
    notes?: string;
  }) {
    const phoneDigits = data.customerPhone.trim();
    if (!/^\d{10}$/.test(phoneDigits)) throw new BadRequestException('Enter exactly 10 Nigerian phone digits');

    const [customer, service, location] = await Promise.all([
      this.prisma.customer.findFirst({ where: { phone: { in: [`0${phoneDigits}`, phoneDigits, `+234${phoneDigits}`, `234${phoneDigits}`] } } }),
      this.prisma.service.findUnique({ where: { slug: data.serviceSlug } }),
      this.prisma.location.findUnique({ where: { slug: data.locationSlug } }),
    ]);

    if (!service || !service.isActive) throw new BadRequestException('Service was not found');
    if (!location || !location.isActive) throw new BadRequestException('Location was not found');

    let therapistUser: { id: string; role: string } | null = null;
    let therapistProfile: { locationId: string; services: { serviceId: string }[] } | null = null;
    if (data.therapistProfileId) {
      const profile = await this.prisma.staffProfile.findUnique({
        where: { id: data.therapistProfileId },
        select: {
          locationId: true,
          services: { select: { serviceId: true } },
          user: { select: { id: true, role: true } },
        },
      });
      therapistUser = profile?.user ?? null;
      therapistProfile = profile ? { locationId: profile.locationId, services: profile.services } : null;
    } else if (data.therapistEmail) {
      const user = await this.prisma.user.findUnique({
        where: { email: data.therapistEmail.trim().toLowerCase() },
        select: {
          id: true,
          role: true,
          staffProfile: {
            select: {
              locationId: true,
              services: { select: { serviceId: true } },
            },
          },
        },
      });
      therapistUser = user ? { id: user.id, role: user.role } : null;
      therapistProfile = user?.staffProfile ?? null;
    }
    if ((data.therapistEmail || data.therapistProfileId) && (!therapistUser || therapistUser.role !== 'THERAPIST')) {
      throw new BadRequestException('Therapist was not found');
    }
    if (therapistProfile && therapistProfile.locationId !== location.id) {
      throw new BadRequestException('Therapist is not assigned to this location');
    }
    if (therapistProfile && !therapistProfile.services.some(({ serviceId }) => serviceId === service.id)) {
      throw new BadRequestException('Therapist is not assigned to this service');
    }

    const room = data.roomName
      ? await this.prisma.room.findUnique({ where: { locationId_name: { locationId: location.id, name: data.roomName.trim() } } })
      : null;
    if (data.roomName && !room) throw new BadRequestException('Room was not found at this location');

    const startsAt = new Date(data.startsAt);
    const endsAt = new Date(data.endsAt);
    if (endsAt <= startsAt) throw new BadRequestException('Appointment end must be after its start');

    const conflicts = await Promise.all([
      therapistUser
        ? this.prisma.appointment.findFirst({
          where: {
            therapistId: therapistUser.id,
            startsAt: { lt: endsAt },
            endsAt: { gt: startsAt },
            status: { in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED, AppointmentStatus.CHECKED_IN, AppointmentStatus.IN_SERVICE] },
          },
          select: { id: true },
        })
        : Promise.resolve(null),
      room
        ? this.prisma.appointment.findFirst({
          where: {
            roomId: room.id,
            startsAt: { lt: endsAt },
            endsAt: { gt: startsAt },
            status: { in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED, AppointmentStatus.CHECKED_IN, AppointmentStatus.IN_SERVICE] },
          },
          select: { id: true },
        })
        : Promise.resolve(null),
    ]);
    if (conflicts.some(Boolean)) throw new BadRequestException('That therapist or room is no longer available at this time');

    return this.prisma.$transaction(async (transaction) => {
      const customerData = {
        firstName: data.customerFirstName.trim(),
        lastName: data.customerLastName.trim(),
        notes: data.customerNote?.trim() || undefined,
      };
      const savedCustomer = customer
        ? await transaction.customer.update({ where: { id: customer.id }, data: customerData })
        : await transaction.customer.create({
          data: { ...customerData, phone: `0${phoneDigits}` },
        });

      return transaction.appointment.create({
        data: {
          customerId: savedCustomer.id,
          locationId: location.id,
          therapistId: therapistUser?.id,
          roomId: room?.id,
          startsAt,
          endsAt,
          status: data.status || AppointmentStatus.PENDING,
          notes: data.notes?.trim() || data.customerNote?.trim() || undefined,
          services: {
            create: {
              serviceId: service.id,
              name: service.name,
              durationMinutes: service.durationMinutes ?? Math.round((endsAt.getTime() - startsAt.getTime()) / 60_000),
              unitPriceKobo: service.priceKobo,
            },
          },
        },
        select: { id: true, startsAt: true, endsAt: true, status: true },
      });
    });
  }

  async options() {
    const [locations, categories, services, therapists, rooms] = await Promise.all([
      this.prisma.location.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' },
        select: { id: true, name: true, slug: true },
      }),
      this.prisma.serviceCategory.findMany({
        where: { isActive: true },
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        select: { id: true, name: true, slug: true },
      }),
      this.prisma.service.findMany({
        where: { isActive: true, category: { isActive: true } },
        orderBy: [{ category: { sortOrder: 'asc' } }, { name: 'asc' }],
        select: { id: true, name: true, slug: true, durationMinutes: true, priceKobo: true, category: { select: { id: true, name: true, slug: true } } },
      }),
      this.prisma.user.findMany({
        where: { role: 'THERAPIST', status: 'ACTIVE', staffProfile: { isBookable: true } },
        orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          staffProfile: {
            select: {
              id: true,
              location: { select: { slug: true } },
              services: { select: { service: { select: { slug: true } } } },
            },
          },
        },
      }),
      this.prisma.room.findMany({
        where: { isActive: true, location: { isActive: true } },
        orderBy: [{ location: { name: 'asc' } }, { name: 'asc' }],
        select: { id: true, name: true, location: { select: { slug: true } } },
      }),
    ]);

    return {
      locations,
      categories,
      services,
      therapists: therapists.map(({ staffProfile, ...therapist }) => ({
        ...therapist,
        staffProfileId: staffProfile?.id ?? '',
        locationSlug: staffProfile?.location.slug ?? '',
        serviceSlugs: staffProfile?.services.map(({ service }) => service.slug) ?? [],
      })),
      rooms: rooms.map(({ location, ...room }) => ({ ...room, locationSlug: location.slug })),
    };
  }

  list() {
    return this.prisma.appointment.findMany({
      orderBy: { startsAt: 'asc' },
      select: {
        id: true,
        startsAt: true,
        endsAt: true,
        status: true,
        notes: true,
        customer: {
          select: { firstName: true, lastName: true, phone: true, email: true },
        },
        therapist: {
          select: { firstName: true, lastName: true },
        },
        location: {
          select: { name: true, city: true },
        },
        room: {
          select: { name: true },
        },
        services: {
          select: { name: true, durationMinutes: true, quantity: true },
        },
      },
    });
  }
}