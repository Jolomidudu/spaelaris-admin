import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PaymentMethod, PaymentStatus } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    appointmentId: string;
    reference: string;
    amountKobo: number;
    method?: PaymentMethod;
    status?: PaymentStatus;
  }) {
    const appointment = await this.prisma.appointment.findUnique({ where: { id: data.appointmentId } });
    if (!appointment) throw new NotFoundException('Appointment was not found');

    const reference = data.reference.trim();
    const existingPayment = await this.prisma.payment.findUnique({ where: { reference } });
    if (existingPayment) throw new ConflictException('Payment reference already exists');

    const status = data.status ?? PaymentStatus.PENDING;
    return this.prisma.payment.create({
      data: {
        appointmentId: appointment.id,
        reference,
        amountKobo: data.amountKobo,
        method: data.method ?? PaymentMethod.CASH,
        status,
        paidAt: status === PaymentStatus.PAID ? new Date() : undefined,
      },
      select: { id: true, reference: true, amountKobo: true, status: true, method: true, paidAt: true },
    });
  }

  async update(id: string, status: PaymentStatus) {
    const payment = await this.prisma.payment.findUnique({ where: { id } });
    if (!payment) throw new NotFoundException('Payment was not found');

    return this.prisma.payment.update({
      where: { id },
      data: {
        status,
        paidAt: status === PaymentStatus.PAID ? payment.paidAt ?? new Date() : payment.paidAt,
        refundedAt: status === PaymentStatus.REFUNDED ? payment.refundedAt ?? new Date() : payment.refundedAt,
      },
      select: { id: true, reference: true, amountKobo: true, status: true, method: true, paidAt: true, refundedAt: true },
    });
  }

  list() {
    return this.prisma.payment.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        appointmentId: true,
        reference: true,
        amountKobo: true,
        status: true,
        method: true,
        paidAt: true,
        createdAt: true,
        appointment: {
          select: {
            startsAt: true,
            customer: {
              select: { firstName: true, lastName: true, phone: true },
            },
            services: {
              select: { name: true },
            },
          },
        },
      },
    });
  }
}