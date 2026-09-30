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
const VALID_APPOINTMENT_TRANSITIONS = {
    [client_1.AppointmentStatus.PENDING]: [
        client_1.AppointmentStatus.CONFIRMED,
        client_1.AppointmentStatus.CANCELLED,
        client_1.AppointmentStatus.NO_SHOW,
    ],
    [client_1.AppointmentStatus.CONFIRMED]: [
        client_1.AppointmentStatus.CHECKED_IN,
        client_1.AppointmentStatus.CANCELLED,
        client_1.AppointmentStatus.NO_SHOW,
    ],
    [client_1.AppointmentStatus.CHECKED_IN]: [
        client_1.AppointmentStatus.IN_SERVICE,
        client_1.AppointmentStatus.CANCELLED,
        client_1.AppointmentStatus.NO_SHOW,
    ],
    [client_1.AppointmentStatus.IN_SERVICE]: [
        client_1.AppointmentStatus.COMPLETED,
        client_1.AppointmentStatus.CANCELLED,
    ],
    [client_1.AppointmentStatus.COMPLETED]: [],
    [client_1.AppointmentStatus.CANCELLED]: [],
    [client_1.AppointmentStatus.NO_SHOW]: [],
};
let AppointmentsService = class AppointmentsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async update(id, data) {
        const appointment = await this.prisma.appointment.findUnique({
            where: { id },
            select: { startsAt: true, endsAt: true, status: true },
        });
        if (!appointment)
            throw new common_1.BadRequestException('Appointment was not found');
        if (data.status && !VALID_APPOINTMENT_TRANSITIONS[appointment.status]?.includes(data.status)) {
            throw new common_1.BadRequestException(`Appointment status cannot move from ${appointment.status} to ${data.status}`);
        }
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
        const normalizedPhone = data.customerPhone.trim();
        if (!/^\+\d{7,15}$/.test(normalizedPhone))
            throw new common_1.BadRequestException('Enter a valid phone number with its country calling code');
        const phoneDigits = normalizedPhone.replace(/\D/g, '');
        const isNigerianNumber = normalizedPhone.startsWith('+234');
        const localNigerianDigits = isNigerianNumber ? phoneDigits.slice(3) : '';
        if (isNigerianNumber && localNigerianDigits.length !== 10) {
            throw new common_1.BadRequestException('Enter exactly 10 Nigerian phone digits after +234');
        }
        const requestedServiceSlugs = data.serviceSlugs?.length
            ? data.serviceSlugs
            : data.serviceSlug
                ? [data.serviceSlug]
                : [];
        if (requestedServiceSlugs.length < 1 || requestedServiceSlugs.length > 3) {
            throw new common_1.BadRequestException('Select between one and three services');
        }
        if (new Set(requestedServiceSlugs).size !== requestedServiceSlugs.length) {
            throw new common_1.BadRequestException('Selected services must be unique');
        }
        const [customer, services, location] = await Promise.all([
            this.prisma.customer.findFirst({
                where: {
                    phone: {
                        in: isNigerianNumber
                            ? [`0${localNigerianDigits}`, localNigerianDigits, `234${localNigerianDigits}`, normalizedPhone]
                            : [normalizedPhone, phoneDigits],
                    },
                },
            }),
            this.prisma.service.findMany({
                where: { slug: { in: requestedServiceSlugs }, isActive: true, category: { isActive: true } },
                select: { id: true, slug: true, name: true, durationMinutes: true, priceKobo: true },
            }),
            this.prisma.location.findUnique({ where: { slug: data.locationSlug } }),
        ]);
        if (services.length !== requestedServiceSlugs.length)
            throw new common_1.BadRequestException('One or more selected services were not found');
        if (services.some((service) => service.durationMinutes === null)) {
            throw new common_1.BadRequestException('Every selected service needs a duration before it can be booked');
        }
        const totalDurationMinutes = services.reduce((total, service) => total + (service.durationMinutes ?? 0), 0);
        if (!location || !location.isActive)
            throw new common_1.BadRequestException('Location was not found');
        let therapistUser = null;
        let therapistProfile = null;
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
        }
        else if (data.therapistEmail) {
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
            throw new common_1.BadRequestException('Therapist was not found');
        }
        if (therapistProfile && therapistProfile.locationId !== location.id) {
            throw new common_1.BadRequestException('Therapist is not assigned to this location');
        }
        if (therapistProfile && !services.every((service) => therapistProfile.services.some(({ serviceId }) => serviceId === service.id))) {
            throw new common_1.BadRequestException('Therapist is not assigned to every selected service');
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
        if (Math.round((endsAt.getTime() - startsAt.getTime()) / 60_000) !== totalDurationMinutes) {
            throw new common_1.BadRequestException('Appointment time must match the combined duration of the selected services');
        }
        const conflicts = await Promise.all([
            therapistUser
                ? this.prisma.appointment.findFirst({
                    where: {
                        therapistId: therapistUser.id,
                        startsAt: { lt: endsAt },
                        endsAt: { gt: startsAt },
                        status: { in: [client_1.AppointmentStatus.PENDING, client_1.AppointmentStatus.CONFIRMED, client_1.AppointmentStatus.CHECKED_IN, client_1.AppointmentStatus.IN_SERVICE] },
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
                        status: { in: [client_1.AppointmentStatus.PENDING, client_1.AppointmentStatus.CONFIRMED, client_1.AppointmentStatus.CHECKED_IN, client_1.AppointmentStatus.IN_SERVICE] },
                    },
                    select: { id: true },
                })
                : Promise.resolve(null),
        ]);
        if (conflicts.some(Boolean))
            throw new common_1.BadRequestException('That therapist or room is no longer available at this time');
        return this.prisma.$transaction(async (transaction) => {
            const customerData = {
                firstName: data.customerFirstName.trim(),
                lastName: data.customerLastName.trim(),
                notes: data.customerNote?.trim() || undefined,
            };
            const savedCustomer = customer
                ? await transaction.customer.update({ where: { id: customer.id }, data: customerData })
                : await transaction.customer.create({
                    data: { ...customerData, phone: isNigerianNumber ? `0${localNigerianDigits}` : normalizedPhone },
                });
            return transaction.appointment.create({
                data: {
                    customerId: savedCustomer.id,
                    locationId: location.id,
                    therapistId: therapistUser?.id,
                    roomId: room?.id,
                    startsAt,
                    endsAt,
                    status: data.status || client_1.AppointmentStatus.PENDING,
                    notes: data.notes?.trim() || data.customerNote?.trim() || undefined,
                    services: {
                        create: services.map((service) => ({
                            serviceId: service.id,
                            name: service.name,
                            durationMinutes: service.durationMinutes,
                            unitPriceKobo: service.priceKobo,
                        })),
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
};
exports.AppointmentsService = AppointmentsService;
exports.AppointmentsService = AppointmentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AppointmentsService);
//# sourceMappingURL=appointments.service.js.map