import { BadRequestException, Injectable } from '@nestjs/common';
import { AppointmentStatus } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';

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
      select: { startsAt: true, endsAt: true },
    });

    if (!appointment) throw new BadRequestException('Appointment was not found');

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
    serviceSlug: string;
    locationSlug: string;
    therapistEmail?: string;
    roomName?: string;
    startsAt: string;
    endsAt: string;
    status?: AppointmentStatus;
    notes?: string;
  }) {
    const [customer, service, location] = await Promise.all([
      this.prisma.customer.findUnique({ where: { phone: data.customerPhone.trim() } }),
      this.prisma.service.findUnique({ where: { slug: data.serviceSlug } }),
      this.prisma.location.findUnique({ where: { slug: data.locationSlug } }),
    ]);

    if (!customer) throw new BadRequestException('Customer phone was not found');
    if (!service || !service.isActive) throw new BadRequestException('Service was not found');
    if (!location || !location.isActive) throw new BadRequestException('Location was not found');

    const therapist = data.therapistEmail
      ? await this.prisma.user.findUnique({ where: { email: data.therapistEmail.trim().toLowerCase() } })
      : null;
    if (data.therapistEmail && (!therapist || therapist.role !== 'THERAPIST')) {
      throw new BadRequestException('Therapist was not found');
    }

    const room = data.roomName
      ? await this.prisma.room.findUnique({ where: { locationId_name: { locationId: location.id, name: data.roomName.trim() } } })
      : null;
    if (data.roomName && !room) throw new BadRequestException('Room was not found at this location');

    const startsAt = new Date(data.startsAt);
    const endsAt = new Date(data.endsAt);
    if (endsAt <= startsAt) throw new BadRequestException('Appointment end must be after its start');

    return this.prisma.appointment.create({
      data: {
        customerId: customer.id,
        locationId: location.id,
        therapistId: therapist?.id,
        roomId: room?.id,
        startsAt,
        endsAt,
        status: data.status || AppointmentStatus.PENDING,
        notes: data.notes?.trim() || undefined,
        services: {
          create: {
            serviceId: service.id,
            name: service.name,
            durationMinutes: service.durationMinutes,
            unitPriceKobo: service.priceKobo,
          },
        },
      },
      select: { id: true, startsAt: true, endsAt: true, status: true },
    });
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
          select: { firstName: true, lastName: true, phone: true },
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