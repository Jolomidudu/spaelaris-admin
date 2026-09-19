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
exports.AppointmentsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../database/prisma.service");
let AppointmentsService = class AppointmentsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async update(id, data) {
        const appointment = await this.prisma.appointment.findUnique({
            where: { id },
            select: { startsAt: true, endsAt: true },
        });
        if (!appointment)
            throw new common_1.BadRequestException('Appointment was not found');
        const startsAt = data.startsAt ? new Date(data.startsAt) : appointment.startsAt;
        const endsAt = data.endsAt ? new Date(data.endsAt) : appointment.endsAt;
        if (endsAt <= startsAt)
            throw new common_1.BadRequestException('Appointment end must be after its start');
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
    async create(data) {
        const [customer, service, location] = await Promise.all([
            this.prisma.customer.findUnique({ where: { phone: data.customerPhone.trim() } }),
            this.prisma.service.findUnique({ where: { slug: data.serviceSlug } }),
            this.prisma.location.findUnique({ where: { slug: data.locationSlug } }),
        ]);
        if (!customer)
            throw new common_1.BadRequestException('Customer phone was not found');
        if (!service || !service.isActive)
            throw new common_1.BadRequestException('Service was not found');
        if (!location || !location.isActive)
            throw new common_1.BadRequestException('Location was not found');
        const therapist = data.therapistEmail
            ? await this.prisma.user.findUnique({ where: { email: data.therapistEmail.trim().toLowerCase() } })
            : null;
        if (data.therapistEmail && (!therapist || therapist.role !== 'THERAPIST')) {
            throw new common_1.BadRequestException('Therapist was not found');
        }
        const room = data.roomName
            ? await this.prisma.room.findUnique({ where: { locationId_name: { locationId: location.id, name: data.roomName.trim() } } })
            : null;
        if (data.roomName && !room)
            throw new common_1.BadRequestException('Room was not found at this location');
        const startsAt = new Date(data.startsAt);
        const endsAt = new Date(data.endsAt);
        if (endsAt <= startsAt)
            throw new common_1.BadRequestException('Appointment end must be after its start');
        return this.prisma.appointment.create({
            data: {
                customerId: customer.id,
                locationId: location.id,
                therapistId: therapist?.id,
                roomId: room?.id,
                startsAt,
                endsAt,
                status: data.status || client_1.AppointmentStatus.PENDING,
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
};
exports.AppointmentsService = AppointmentsService;
exports.AppointmentsService = AppointmentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AppointmentsService);
//# sourceMappingURL=appointments.service.js.map