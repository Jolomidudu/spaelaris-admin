import { BadRequestException, ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PaymentMethod, PaymentStatus } from '@prisma/client';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  async initialize(data: {
    appointmentId: string;
    reference: string;
    amountKobo: number;
    email: string;
    method?: PaymentMethod;
    status?: PaymentStatus;
  }) {
    const secret = process.env.PAYSTACK_SECRET_KEY;
    if (!secret) throw new BadRequestException('Paystack is not configured');

    const payment = await this.create({ ...data, method: PaymentMethod.PAYSTACK });
    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secret}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: data.email,
        amount: data.amountKobo,
        reference: payment.reference,
      }),
    });

    const payload = (await response.json()) as { status?: boolean; message?: string; data?: unknown };
    if (!response.ok || !payload.status) throw new BadRequestException(payload.message || 'Paystack initialization failed');
    return payload.data;
  }

  async handleWebhook(signature: string, rawBody: Buffer) {
    const secret = process.env.PAYSTACK_SECRET_KEY;
    if (!secret) throw new BadRequestException('Paystack is not configured');

    const hash = createHmac('sha512', secret).update(rawBody).digest('hex');
    const expected = Buffer.from(hash, 'utf8');
    const received = Buffer.from(signature, 'utf8');
    if (expected.length !== received.length || !timingSafeEqual(expected, received)) {
      throw new UnauthorizedException('Invalid Paystack signature');
    }

    const body = JSON.parse(rawBody.toString('utf8')) as { event?: string; data?: { reference?: string; status?: string } };
    const data = body.data;
    if (body.event !== 'charge.success' || !data?.reference) return { received: true };

    await this.prisma.payment.updateMany({
      where: { reference: data.reference },
      data: { status: PaymentStatus.PAID, paidAt: new Date() },
    });
    return { received: true };
  }

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