import { Injectable } from '@nestjs/common';
import { AppointmentStatus, PaymentStatus, UserRole, UserStatus } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';

function getLocalDayRange(timeZone: string, now: Date) {
  const dateLabel = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
  const localMidnightUtc = new Date(`${dateLabel}T00:00:00.000Z`);
  const offsetAt = (date: Date) => {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(date);
    const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
    return Date.UTC(
      Number(values.year),
      Number(values.month) - 1,
      Number(values.day),
      Number(values.hour),
      Number(values.minute),
      Number(values.second),
    ) - date.getTime();
  };
  const start = new Date(localMidnightUtc.getTime() - offsetAt(localMidnightUtc));
  const nextMidnight = new Date(localMidnightUtc.getTime() + 24 * 60 * 60 * 1000);
  const end = new Date(nextMidnight.getTime() - offsetAt(nextMidnight));
  return { start, end };
}

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async summary() {
    const now = new Date();
    const { start: todayStart, end: todayEnd } = getLocalDayRange('Africa/Lagos', now);
    const [staff, services, categories, appointmentsToday, todaySchedule, revenueToday, availableTherapists, pendingPayments] = await Promise.all([
      this.prisma.user.count({
        where: {
          status: UserStatus.ACTIVE,
          role: { in: [UserRole.MANAGER, UserRole.RECEPTIONIST, UserRole.THERAPIST] },
        },
      }),
      this.prisma.service.count({
        where: { isActive: true, category: { isActive: true } },
      }),
      this.prisma.serviceCategory.count({ where: { isActive: true } }),
      this.prisma.appointment.count({
        where: {
          startsAt: { gte: todayStart, lt: todayEnd },
          status: { notIn: [AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW] },
        },
      }),
      this.prisma.appointment.findMany({
        where: {
          startsAt: { gte: todayStart, lt: todayEnd },
          status: { notIn: [AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW] },
        },
        orderBy: { startsAt: 'asc' },
        take: 6,
        select: {
          id: true,
          startsAt: true,
          status: true,
          customer: { select: { firstName: true, lastName: true } },
          therapist: { select: { firstName: true, lastName: true } },
          location: { select: { name: true, city: true } },
          services: { select: { name: true } },
        },
      }),
      this.prisma.payment.aggregate({
        where: { status: PaymentStatus.PAID, paidAt: { gte: todayStart, lt: todayEnd } },
        _sum: { amountKobo: true },
      }),
      this.prisma.staffProfile.count({
        where: {
          isBookable: true,
          location: { isActive: true },
          timeOff: { none: { startsAt: { lte: now }, endsAt: { gt: now } } },
          user: {
            status: UserStatus.ACTIVE,
            role: UserRole.THERAPIST,
            appointments: {
              none: {
                startsAt: { lte: now },
                endsAt: { gt: now },
                status: { notIn: [AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW] },
              },
            },
          },
        },
      }),
      this.prisma.payment.aggregate({
        where: { status: PaymentStatus.PENDING },
        _sum: { amountKobo: true },
        _count: { _all: true },
      }),
    ]);

    return {
      staff,
      services,
      categories,
      appointmentsToday,
      todaySchedule,
      revenueTodayKobo: revenueToday._sum.amountKobo ?? 0,
      availableTherapists,
      pendingPaymentsKobo: pendingPayments._sum.amountKobo ?? 0,
      pendingPaymentCount: pendingPayments._count._all,
    };
  }
}
