import { Injectable } from '@nestjs/common';
import { AppointmentStatus, PaymentStatus, UserRole } from '@prisma/client';
import { AuthenticatedUser } from '../auth/auth.types';
import { hasPermission, Permission } from '../auth/permissions';
import { PrismaService } from '../database/prisma.service';

type NotificationItem = {
  id: string;
  kind: 'appointment' | 'payment' | 'customer';
  title: string;
  description: string;
  createdAt: Date;
  href: string;
  priority: 'urgent' | 'normal';
};

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(user: AuthenticatedUser, limit = 12): Promise<NotificationItem[]> {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const canManageAppointments = hasPermission(user.role, Permission.ManageAppointments);
    const canViewAppointments = canManageAppointments || user.role === UserRole.THERAPIST;
    const appointmentScope = canManageAppointments ? {} : { therapistId: user.id };
    const canViewPayments = hasPermission(user.role, Permission.ManagePayments);
    const canViewCustomers = hasPermission(user.role, Permission.ManageCustomers);

    const [recentAppointments, pendingAppointments, recentPayments, attentionPayments, recentCustomers] = await Promise.all([
      canViewAppointments
        ? this.prisma.appointment.findMany({
            where: { ...appointmentScope, createdAt: { gte: since } },
            orderBy: { createdAt: 'desc' },
            take: limit,
            select: {
              id: true,
              createdAt: true,
              startsAt: true,
              status: true,
              customer: { select: { firstName: true, lastName: true } },
            },
          })
        : Promise.resolve([]),
      canViewAppointments
        ? this.prisma.appointment.findMany({
            where: { ...appointmentScope, status: AppointmentStatus.PENDING },
            orderBy: { startsAt: 'asc' },
            take: limit,
            select: {
              id: true,
              createdAt: true,
              startsAt: true,
              customer: { select: { firstName: true, lastName: true } },
            },
          })
        : Promise.resolve([]),
      canViewPayments
        ? this.prisma.payment.findMany({
            where: { createdAt: { gte: since } },
            orderBy: { createdAt: 'desc' },
            take: limit,
            select: {
              id: true,
              amountKobo: true,
              status: true,
              createdAt: true,
              updatedAt: true,
              appointment: { select: { customer: { select: { firstName: true, lastName: true } } } },
            },
          })
        : Promise.resolve([]),
      canViewPayments
        ? this.prisma.payment.findMany({
            where: { status: { in: [PaymentStatus.PENDING, PaymentStatus.FAILED] } },
            orderBy: { updatedAt: 'desc' },
            take: limit,
            select: {
              id: true,
              amountKobo: true,
              status: true,
              createdAt: true,
              updatedAt: true,
              appointment: { select: { customer: { select: { firstName: true, lastName: true } } } },
            },
          })
        : Promise.resolve([]),
      canViewCustomers
        ? this.prisma.customer.findMany({
            where: { createdAt: { gte: since } },
            orderBy: { createdAt: 'desc' },
            take: limit,
            select: { id: true, firstName: true, lastName: true, createdAt: true },
          })
        : Promise.resolve([]),
    ]);

    const items = new Map<string, NotificationItem>();
    const customerName = (customer: { firstName: string; lastName: string }) => `${customer.firstName} ${customer.lastName}`.trim();

    for (const appointment of recentAppointments) {
      const isPending = appointment.status === AppointmentStatus.PENDING;
      items.set(`appointment:${appointment.id}`, {
        id: `appointment:${appointment.id}`,
        kind: 'appointment',
        title: isPending ? 'Appointment needs confirmation' : 'New appointment booked',
        description: `${customerName(appointment.customer)} · ${appointment.startsAt.toLocaleString('en-NG')}`,
        createdAt: appointment.createdAt,
        href: '/appointments',
        priority: isPending ? 'urgent' : 'normal',
      });
    }

    for (const appointment of pendingAppointments) {
      const id = `appointment:${appointment.id}`;
      const existing = items.get(id);
      items.set(id, {
        id,
        kind: 'appointment',
        title: 'Appointment needs confirmation',
        description: `${customerName(appointment.customer)} · ${appointment.startsAt.toLocaleString('en-NG')}`,
        createdAt: existing?.createdAt ?? appointment.createdAt,
        href: '/appointments',
        priority: 'urgent',
      });
    }

    for (const payment of recentPayments) {
      const isUnresolved = payment.status === PaymentStatus.PENDING || payment.status === PaymentStatus.FAILED;
      items.set(`payment:${payment.id}`, {
        id: `payment:${payment.id}`,
        kind: 'payment',
        title: isUnresolved ? 'Payment needs attention' : `Payment ${payment.status.toLowerCase().replaceAll('_', ' ')}`,
        description: `${customerName(payment.appointment.customer)} · ₦${(payment.amountKobo / 100).toLocaleString('en-NG')}`,
        createdAt: isUnresolved ? payment.updatedAt : payment.createdAt,
        href: '/payments',
        priority: isUnresolved ? 'urgent' : 'normal',
      });
    }

    for (const payment of attentionPayments) {
      const id = `payment:${payment.id}`;
      const existing = items.get(id);
      items.set(id, {
        id,
        kind: 'payment',
        title: 'Payment needs attention',
        description: `${customerName(payment.appointment.customer)} · ₦${(payment.amountKobo / 100).toLocaleString('en-NG')} · ${payment.status.toLowerCase()}`,
        createdAt: existing?.createdAt ?? payment.updatedAt,
        href: '/payments',
        priority: 'urgent',
      });
    }

    for (const customer of recentCustomers) {
      items.set(`customer:${customer.id}`, {
        id: `customer:${customer.id}`,
        kind: 'customer',
        title: 'New customer',
        description: customerName(customer),
        createdAt: customer.createdAt,
        href: '/customers',
        priority: 'normal',
      });
    }

    return [...items.values()]
      .sort((left, right) => {
        if (left.priority !== right.priority) return left.priority === 'urgent' ? -1 : 1;
        return right.createdAt.getTime() - left.createdAt.getTime();
      })
      .slice(0, limit);
  }
}