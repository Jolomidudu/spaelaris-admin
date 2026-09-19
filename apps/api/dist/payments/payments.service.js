"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const node_crypto_1 = require("node:crypto");
const prisma_service_1 = require("../database/prisma.service");
let PaymentsService = class PaymentsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async initialize(data) {
        const secret = process.env.PAYSTACK_SECRET_KEY;
        if (!secret)
            throw new common_1.BadRequestException('Paystack is not configured');
        const payment = await this.create({ ...data, method: client_1.PaymentMethod.PAYSTACK });
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
        const payload = (await response.json());
        if (!response.ok || !payload.status)
            throw new common_1.BadRequestException(payload.message || 'Paystack initialization failed');
        return payload.data;
    }
    async handleWebhook(signature, rawBody) {
        const secret = process.env.PAYSTACK_SECRET_KEY;
        if (!secret)
            throw new common_1.BadRequestException('Paystack is not configured');
        const hash = (0, node_crypto_1.createHmac)('sha512', secret).update(rawBody).digest('hex');
        const expected = Buffer.from(hash, 'utf8');
        const received = Buffer.from(signature, 'utf8');
        if (expected.length !== received.length || !(0, node_crypto_1.timingSafeEqual)(expected, received)) {
            throw new common_1.UnauthorizedException('Invalid Paystack signature');
        }
        const body = JSON.parse(rawBody.toString('utf8'));
        const data = body.data;
        if (body.event !== 'charge.success' || !data?.reference)
            return { received: true };
        await this.prisma.payment.updateMany({
            where: { reference: data.reference },
            data: { status: client_1.PaymentStatus.PAID, paidAt: new Date() },
        });
        return { received: true };
    }
    async create(data) {
        const appointment = await this.prisma.appointment.findUnique({ where: { id: data.appointmentId } });
        if (!appointment)
            throw new common_1.NotFoundException('Appointment was not found');
        const reference = data.reference.trim();
        const existingPayment = await this.prisma.payment.findUnique({ where: { reference } });
        if (existingPayment)
            throw new common_1.ConflictException('Payment reference already exists');
        const status = data.status ?? client_1.PaymentStatus.PENDING;
        return this.prisma.payment.create({
            data: {
                appointmentId: appointment.id,
                reference,
                amountKobo: data.amountKobo,
                method: data.method ?? client_1.PaymentMethod.CASH,
                status,
                paidAt: status === client_1.PaymentStatus.PAID ? new Date() : undefined,
            },
            select: { id: true, reference: true, amountKobo: true, status: true, method: true, paidAt: true },
        });
    }
    async update(id, status) {
        const payment = await this.prisma.payment.findUnique({ where: { id } });
        if (!payment)
            throw new common_1.NotFoundException('Payment was not found');
        return this.prisma.payment.update({
            where: { id },
            data: {
                status,
                paidAt: status === client_1.PaymentStatus.PAID ? payment.paidAt ?? new Date() : payment.paidAt,
                refundedAt: status === client_1.PaymentStatus.REFUNDED ? payment.refundedAt ?? new Date() : payment.refundedAt,
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
};
exports.PaymentsService = PaymentsService;
exports.PaymentsService = PaymentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PaymentsService);
//# sourceMappingURL=payments.service.js.map