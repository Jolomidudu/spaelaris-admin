import { BadRequestException, Injectable } from '@nestjs/common';
import { AppointmentStatus, UserRole, UserStatus } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';

const SLOT_INTERVAL_MINUTES = 30;
const BUSY_STATUSES = [
  AppointmentStatus.PENDING,
  AppointmentStatus.CONFIRMED,
  AppointmentStatus.CHECKED_IN,
  AppointmentStatus.IN_SERVICE,
];

type TimeRange = { startsAt: Date; endsAt: Date };

function getWeekday(date: string, timeZone: string) {
  const weekday = new Intl.DateTimeFormat('en-US', { timeZone, weekday: 'short' }).format(
    localDateTimeToUtc(date, '12:00', timeZone),
  );
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(weekday);
}

function localDateTimeToUtc(date: string, time: string, timeZone: string) {
  const [year, month, day] = date.split('-').map(Number);
  const [hour, minute] = time.split(':').map(Number);
  const targetAsUtc = Date.UTC(year, month - 1, day, hour, minute);
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date(targetAsUtc));
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  const representedAsUtc = Date.UTC(
    Number(values.year),
    Number(values.month) - 1,
    Number(values.day),
    Number(values.hour),
    Number(values.minute),
    Number(values.second),
  );
  return new Date(targetAsUtc - (representedAsUtc - targetAsUtc));
}

function overlaps(first: TimeRange, second: TimeRange) {
  return first.startsAt < second.endsAt && first.endsAt > second.startsAt;
}

@Injectable()
export class PublicBookingService {
  constructor(private readonly prisma: PrismaService) {}

  locations() {
    return this.prisma.location.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, slug: true, address: true, city: true, timezone: true },
    });
  }

  async availability(locationSlug: string, date: string, serviceSlugs: string[]) {
    if (!locationSlug?.trim()) throw new BadRequestException('locationSlug is required');
    const parsedDate = new Date(`${date}T00:00:00.000Z`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== date) {
      throw new BadRequestException('date must use YYYY-MM-DD format');
    }
    if (serviceSlugs.length === 0 || serviceSlugs.some((slug) => !slug.trim())) {
      throw new BadRequestException('At least one service slug is required');
    }
    if (new Set(serviceSlugs).size !== serviceSlugs.length) {
      throw new BadRequestException('Service slugs must be unique');
    }

    const location = await this.prisma.location.findUnique({ where: { slug: locationSlug } });
    if (!location?.isActive) throw new BadRequestException('Location was not found');

    const services = await this.prisma.service.findMany({
      where: {
        slug: { in: serviceSlugs },
        isActive: true,
        category: { isActive: true },
      },
      select: { id: true, slug: true, name: true, durationMinutes: true },
    });
    if (services.length !== serviceSlugs.length) {
      throw new BadRequestException('One or more services are unavailable');
    }
    if (services.some((service) => service.durationMinutes === null)) {
      throw new BadRequestException('Selected services need a duration before they can be booked online');
    }

    const totalDurationMinutes = services.reduce((total, service) => total + (service.durationMinutes ?? 0), 0);
    const weekday = getWeekday(date, location.timezone);
    const dayStart = localDateTimeToUtc(date, '00:00', location.timezone);
    const nextDate = new Date(`${date}T12:00:00.000Z`);
    nextDate.setUTCDate(nextDate.getUTCDate() + 1);
    const nextDateString = nextDate.toISOString().slice(0, 10);
    const dayEnd = localDateTimeToUtc(nextDateString, '00:00', location.timezone);
    const profiles = await this.prisma.staffProfile.findMany({
      where: {
        locationId: location.id,
        isBookable: true,
        user: { status: UserStatus.ACTIVE, role: UserRole.THERAPIST },
        services: { some: { serviceId: { in: services.map(({ id }) => id) } } },
      },
      select: {
        id: true,
        user: { select: { id: true, firstName: true, lastName: true } },
        services: { select: { serviceId: true, service: { select: { isActive: true, category: { select: { isActive: true } } } } } },
        availability: { where: { dayOfWeek: weekday }, select: { startTime: true, endTime: true } },
        timeOff: { where: { startsAt: { lt: dayEnd }, endsAt: { gt: dayStart } }, select: { startsAt: true, endsAt: true } },
      },
    });

    const requestedServiceIds = new Set(services.map(({ id }) => id));
    const qualifiedProfiles = profiles.filter((profile) => {
      const linkedServiceIds = new Set(
        profile.services
          .filter(({ service }) => service.isActive && service.category.isActive)
          .map(({ serviceId }) => serviceId),
      );
      return [...requestedServiceIds].every((id) => linkedServiceIds.has(id));
    });
    const rooms = await this.prisma.room.findMany({
      where: { locationId: location.id, isActive: true },
      select: { id: true, name: true },
    });
    if (qualifiedProfiles.length === 0 || rooms.length === 0) return { date, locationSlug, totalDurationMinutes, slotIntervalMinutes: SLOT_INTERVAL_MINUTES, slots: [] };

    const [appointments, roomAppointments] = await Promise.all([
      this.prisma.appointment.findMany({
        where: {
          therapistId: { in: qualifiedProfiles.map(({ user }) => user.id) },
          startsAt: { lt: dayEnd },
          endsAt: { gt: dayStart },
          status: { in: BUSY_STATUSES },
        },
        select: { therapistId: true, roomId: true, startsAt: true, endsAt: true },
      }),
      this.prisma.appointment.findMany({
        where: {
          roomId: { in: rooms.map(({ id }) => id) },
          startsAt: { lt: dayEnd },
          endsAt: { gt: dayStart },
          status: { in: BUSY_STATUSES },
        },
        select: { roomId: true, startsAt: true, endsAt: true },
      }),
    ]);

    const slots: Array<{
      startsAt: string;
      endsAt: string;
      therapistId: string;
      therapistName: string;
      availableRoomCount: number;
    }> = [];

    for (const profile of qualifiedProfiles) {
      for (const window of profile.availability) {
        const [startHour, startMinute] = window.startTime.split(':').map(Number);
        const [endHour, endMinute] = window.endTime.split(':').map(Number);
        const windowStart = startHour * 60 + startMinute;
        const windowEnd = endHour * 60 + endMinute;

        for (let minute = windowStart; minute + totalDurationMinutes <= windowEnd; minute += SLOT_INTERVAL_MINUTES) {
          const startTime = `${String(Math.floor(minute / 60)).padStart(2, '0')}:${String(minute % 60).padStart(2, '0')}`;
          const endMinuteOfDay = minute + totalDurationMinutes;
          const endTime = `${String(Math.floor(endMinuteOfDay / 60)).padStart(2, '0')}:${String(endMinuteOfDay % 60).padStart(2, '0')}`;
          const startsAt = localDateTimeToUtc(date, startTime, location.timezone);
          const endsAt = localDateTimeToUtc(date, endTime, location.timezone);
          const candidate = { startsAt, endsAt };
          if (startsAt <= new Date()) continue;
          if (profile.timeOff.some((range) => overlaps(candidate, range))) continue;
          if (appointments.some((item) => item.therapistId === profile.user.id && overlaps(candidate, item))) continue;

          const availableRoomCount = rooms.filter((room) =>
            !roomAppointments.some((item) => item.roomId === room.id && overlaps(candidate, item)),
          ).length;
          if (availableRoomCount === 0) continue;

          slots.push({
            startsAt: startsAt.toISOString(),
            endsAt: endsAt.toISOString(),
            therapistId: profile.id,
            therapistName: `${profile.user.firstName} ${profile.user.lastName}`,
            availableRoomCount,
          });
        }
      }
    }

    return {
      date,
      locationSlug,
      totalDurationMinutes,
      slotIntervalMinutes: SLOT_INTERVAL_MINUTES,
      slots: slots.sort((a, b) => a.startsAt.localeCompare(b.startsAt) || a.therapistName.localeCompare(b.therapistName)),
    };
  }
}
