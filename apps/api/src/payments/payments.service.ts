import { BadRequestException, ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PaymentMethod, PaymentStatus } from '@prisma/client';
import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  async initializeAppointmentPayment(appointmentId: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      select: {
        id: true,
        status: true,
        customer: { select: { email: true } },
        services: { select: { unitPriceKobo: true, quantity: true } },
      },
    });
    if (!appointment) throw new NotFoundException('Appointment was not found');
    if (appointment.status !== 'PENDING') throw new BadRequestException('Only pending appointments can be paid online');
    if (!appointment.customer.email) throw new BadRequestException('An email address is required for Paystack checkout');

    const amountKobo = appointment.services.reduce((total, service) => total + service.unitPriceKobo * service.quantity, 0);
    if (amountKobo < 1) throw new BadRequestException('Appointment has no payable services');

    const secret = process.env.PAYSTACK_SECRET_KEY;
    if (!secret) throw new BadRequestException('Paystack is not configured');

    const reference = `spaelaris-${appointment.id}-${randomUUID()}`;
    await this.prisma.payment.updateMany({
      where: { appointmentId, status: PaymentStatus.PENDING, method: PaymentMethod.PAYSTACK },
      data: { status: PaymentStatus.FAILED },
    });
    const payment = await this.prisma.payment.create({
      data: {
        appointmentId,
        reference,
        amountKobo,
        method: PaymentMethod.PAYSTACK,
        status: PaymentStatus.PENDING,
      },
    });

    const webBaseUrl = (process.env.CUSTOMER_WEB_URL ?? 'https://spaelaris.vercel.app').replace(/\/+$/, '');
    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secret}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: appointment.customer.email,
        amount: amountKobo,
        reference: payment.reference,
        callback_url: `${webBaseUrl}/book`,
        metadata: { appointmentId: appointment.id },
      }),
    });

    const payload = (await response.json()) as {
      status?: boolean;
      message?: string;
      data?: { authorization_url?: string; access_code?: string; reference?: string };
    };
    if (!response.ok || !payload.status || !payload.data?.authorization_url) {
      await this.prisma.payment.update({ where: { id: payment.id }, data: { status: PaymentStatus.FAILED } });
      throw new BadRequestException(payload.message || 'Paystack initialization failed');
    }

    return {
      reference: payment.reference,
      amountKobo,
      authorizationUrl: payload.data.authorization_url,
    };
  }

  async verifyAppointmentPayment(reference: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { reference },
      select: {
        id: true,
        reference: true,
        amountKobo: true,
        status: true,
        method: true,
        appointment: {
          select: {
            id: true,
            startsAt: true,
            endsAt: true,
            status: true,
            location: { select: { name: true, city: true } },
            therapist: { select: { firstName: true, lastName: true } },
            room: { select: { name: true } },
            services: { select: { name: true, unitPriceKobo: true, durationMinutes: true } },
          },
        },
      },
    });
    if (!payment || payment.method !== PaymentMethod.PAYSTACK) throw new NotFoundException('Payment reference was not found');
    if (payment.status !== PaymentStatus.PAID) {
      const secret = process.env.PAYSTACK_SECRET_KEY;
      if (!secret) throw new BadRequestException('Paystack is not configured');
      const response = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(payment.reference)}`, {
        headers: { Authorization: `Bearer ${secret}` },
      });
      const payload = (await response.json()) as {
        status?: boolean;
        message?: string;
        data?: { status?: string; amount?: number; currency?: string; reference?: string };
      };
      if (!response.ok || !payload.status) throw new BadRequestException(payload.message || 'Unable to verify payment');

      if (payload.data?.status === 'success') {
        if (payload.data.reference !== payment.reference || payload.data.amount !== payment.amountKobo || payload.data.currency !== 'NGN') {
          throw new BadRequestException('Paystack payment details do not match this appointment');
        }
        await this.prisma.$transaction([
          this.prisma.payment.update({
            where: { id: payment.id },
            data: { status: PaymentStatus.PAID, paidAt: new Date() },
          }),
          this.prisma.appointment.updateMany({
            where: { id: payment.appointment.id, status: 'PENDING' },
            data: { status: 'CONFIRMED' },
          }),
        ]);
        payment.status = PaymentStatus.PAID;
        payment.appointment.status = 'CONFIRMED';
      }
    }

    return {
      reference: payment.reference,
      status: payment.status,
      amountKobo: payment.amountKobo,
      appointment: payment.appointment,
    };
  }

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

    const body = JSON.parse(rawBody.toString('utf8')) as {
      event?: string;
      data?: { reference?: string; status?: string; amount?: number; currency?: string };
    };
    const data = body.data;
    if (body.event !== 'charge.success' || !data?.reference) return { received: true };

    const payment = await this.prisma.payment.findUnique({
      where: { reference: data.reference },
      select: { id: true, appointmentId: true, amountKobo: true, status: true },
    });
    if (!payment) return { received: true };
    if (data.status !== 'success' || data.amount !== payment.amountKobo || data.currency !== 'NGN') {
      throw new BadRequestException('Paystack webhook details do not match this payment');
    }
    if (payment.status === PaymentStatus.PAID) return { received: true };
    if (payment.status !== PaymentStatus.PENDING) return { received: true };

    await this.prisma.$transaction([
      this.prisma.payment.update({
        where: { id: payment.id },
        data: { status: PaymentStatus.PAID, paidAt: new Date() },
      }),
      this.prisma.appointment.updateMany({
        where: { id: payment.appointmentId, status: 'PENDING' },
        data: { status: 'CONFIRMED' },
      }),
    ]);
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