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
exports.PublicBookingService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../database/prisma.service");
const SLOT_INTERVAL_MINUTES = 30;
const BUSY_STATUSES = [
    client_1.AppointmentStatus.PENDING,
    client_1.AppointmentStatus.CONFIRMED,
    client_1.AppointmentStatus.CHECKED_IN,
    client_1.AppointmentStatus.IN_SERVICE,
];
function getWeekday(date, timeZone) {
    const weekday = new Intl.DateTimeFormat('en-US', { timeZone, weekday: 'short' }).format(localDateTimeToUtc(date, '12:00', timeZone));
    return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(weekday);
}
function localDateTimeToUtc(date, time, timeZone) {
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
    const representedAsUtc = Date.UTC(Number(values.year), Number(values.month) - 1, Number(values.day), Number(values.hour), Number(values.minute), Number(values.second));
    return new Date(targetAsUtc - (representedAsUtc - targetAsUtc));
}
function overlaps(first, second) {
    return first.startsAt < second.endsAt && first.endsAt > second.startsAt;
}
let PublicBookingService = class PublicBookingService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    locations() {
        return this.prisma.location.findMany({
            where: { isActive: true },
            orderBy: { name: 'asc' },
            select: { id: true, name: true, slug: true, address: true, city: true, timezone: true },
        });
    }
    async availability(locationSlug, date, serviceSlugs) {
        if (!locationSlug?.trim())
            throw new common_1.BadRequestException('locationSlug is required');
        const parsedDate = new Date(`${date}T00:00:00.000Z`);
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== date) {
            throw new common_1.BadRequestException('date must use YYYY-MM-DD format');
        }
        if (serviceSlugs.length === 0 || serviceSlugs.some((slug) => !slug.trim())) {
            throw new common_1.BadRequestException('At least one service slug is required');
        }
        if (new Set(serviceSlugs).size !== serviceSlugs.length) {
            throw new common_1.BadRequestException('Service slugs must be unique');
        }
        const location = await this.prisma.location.findUnique({ where: { slug: locationSlug } });
        if (!location?.isActive)
            throw new common_1.BadRequestException('Location was not found');
        const services = await this.prisma.service.findMany({
            where: {
                slug: { in: serviceSlugs },
                isActive: true,
                category: { isActive: true },
            },
            select: { id: true, slug: true, name: true, durationMinutes: true },
        });
        if (services.length !== serviceSlugs.length) {
            throw new common_1.BadRequestException('One or more services are unavailable');
        }
        if (services.some((service) => service.durationMinutes === null)) {
            throw new common_1.BadRequestException('Selected services need a duration before they can be booked online');
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
                user: { status: client_1.UserStatus.ACTIVE, role: client_1.UserRole.THERAPIST },
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
            const linkedServiceIds = new Set(profile.services
                .filter(({ service }) => service.isActive && service.category.isActive)
                .map(({ serviceId }) => serviceId));
            return [...requestedServiceIds].every((id) => linkedServiceIds.has(id));
        });
        const rooms = await this.prisma.room.findMany({
            where: { locationId: location.id, isActive: true },
            select: { id: true, name: true },
        });
        if (qualifiedProfiles.length === 0 || rooms.length === 0)
            return { date, locationSlug, totalDurationMinutes, slotIntervalMinutes: SLOT_INTERVAL_MINUTES, slots: [] };
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
        const slots = [];
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
                    if (startsAt <= new Date())
                        continue;
                    if (profile.timeOff.some((range) => overlaps(candidate, range)))
                        continue;
                    if (appointments.some((item) => item.therapistId === profile.user.id && overlaps(candidate, item)))
                        continue;
                    const availableRoomCount = rooms.filter((room) => !roomAppointments.some((item) => item.roomId === room.id && overlaps(candidate, item))).length;
                    if (availableRoomCount === 0)
                        continue;
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
    async createBooking(data) {
        if (new Set(data.serviceSlugs).size !== data.serviceSlugs.length || data.serviceSlugs.length === 0) {
            throw new common_1.BadRequestException('Choose one or more unique services');
        }
        const startsAt = new Date(data.startsAt);
        const endsAt = new Date(data.endsAt);
        if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime()) || endsAt <= startsAt) {
            throw new common_1.BadRequestException('The selected appointment time is invalid');
        }
        const location = await this.prisma.location.findUnique({ where: { slug: data.locationSlug } });
        if (!location?.isActive)
            throw new common_1.BadRequestException('Location was not found');
        const localDateParts = new Intl.DateTimeFormat('en-CA', {
            timeZone: location.timezone,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        }).formatToParts(startsAt);
        const localDate = `${localDateParts.find(({ type }) => type === 'year')?.value}-${localDateParts.find(({ type }) => type === 'month')?.value}-${localDateParts.find(({ type }) => type === 'day')?.value}`;
        const availability = await this.availability(data.locationSlug, localDate, data.serviceSlugs);
        const matchingSlot = availability.slots.find((slot) => slot.therapistId === data.therapistProfileId &&
            new Date(slot.startsAt).getTime() === startsAt.getTime() &&
            new Date(slot.endsAt).getTime() === endsAt.getTime());
        if (!matchingSlot)
            throw new common_1.ConflictException('That appointment time is no longer available. Please select another slot.');
        const services = await this.prisma.service.findMany({
            where: { slug: { in: data.serviceSlugs }, isActive: true, category: { isActive: true } },
            select: { id: true, name: true, durationMinutes: true, priceKobo: true },
        });
        if (services.length !== data.serviceSlugs.length || services.some((service) => service.durationMinutes === null)) {
            throw new common_1.BadRequestException('One or more selected services cannot be booked online');
        }
        try {
            return await this.prisma.$transaction(async (transaction) => {
                const therapist = await transaction.staffProfile.findFirst({
                    where: {
                        id: data.therapistProfileId,
                        locationId: location.id,
                        isBookable: true,
                        user: { role: client_1.UserRole.THERAPIST, status: client_1.UserStatus.ACTIVE },
                        services: { some: { serviceId: { in: services.map(({ id }) => id) } } },
                    },
                    select: {
                        userId: true,
                        availability: { where: { dayOfWeek: getWeekday(localDate, location.timezone) }, select: { startTime: true, endTime: true } },
                        services: { select: { serviceId: true, service: { select: { isActive: true, category: { select: { isActive: true } } } } } },
                    },
                });
                if (!therapist)
                    throw new common_1.ConflictException('That therapist is no longer available for these services');
                const linkedServiceIds = new Set(therapist.services
                    .filter(({ service }) => service.isActive && service.category.isActive)
                    .map(({ serviceId }) => serviceId));
                if (!services.every(({ id }) => linkedServiceIds.has(id))) {
                    throw new common_1.ConflictException('That therapist is no longer available for all selected services');
                }
                const localStart = new Intl.DateTimeFormat('en-GB', {
                    timeZone: location.timezone,
                    hour: '2-digit',
                    minute: '2-digit',
                    hourCycle: 'h23',
                }).format(startsAt);
                const localEnd = new Intl.DateTimeFormat('en-GB', {
                    timeZone: location.timezone,
                    hour: '2-digit',
                    minute: '2-digit',
                    hourCycle: 'h23',
                }).format(endsAt);
                const startMinute = Number(localStart.slice(0, 2)) * 60 + Number(localStart.slice(3));
                const endMinute = Number(localEnd.slice(0, 2)) * 60 + Number(localEnd.slice(3));
                const durationMinutes = Math.round((endsAt.getTime() - startsAt.getTime()) / 60_000);
                const withinSchedule = therapist.availability.some((period) => {
                    const periodStart = Number(period.startTime.slice(0, 2)) * 60 + Number(period.startTime.slice(3));
                    const periodEnd = Number(period.endTime.slice(0, 2)) * 60 + Number(period.endTime.slice(3));
                    return startMinute >= periodStart && endMinute <= periodEnd;
                });
                if (!withinSchedule || durationMinutes !== availability.totalDurationMinutes) {
                    throw new common_1.ConflictException('That appointment time is outside the therapist’s current availability');
                }
                const [timeOff, therapistConflict, rooms] = await Promise.all([
                    transaction.staffTimeOff.findFirst({
                        where: { staffProfileId: data.therapistProfileId, startsAt: { lt: endsAt }, endsAt: { gt: startsAt } },
                        select: { id: true },
                    }),
                    transaction.appointment.findFirst({
                        where: {
                            therapistId: therapist.userId,
                            startsAt: { lt: endsAt },
                            endsAt: { gt: startsAt },
                            status: { in: BUSY_STATUSES },
                        },
                        select: { id: true },
                    }),
                    transaction.room.findMany({
                        where: { locationId: location.id, isActive: true },
                        select: { id: true },
                    }),
                ]);
                if (timeOff || therapistConflict)
                    throw new common_1.ConflictException('That appointment time has just been taken');
                const roomConflicts = await transaction.appointment.findMany({
                    where: {
                        roomId: { in: rooms.map(({ id }) => id) },
                        startsAt: { lt: endsAt },
                        endsAt: { gt: startsAt },
                        status: { in: BUSY_STATUSES },
                    },
                    select: { roomId: true },
                });
                const busyRoomIds = new Set(roomConflicts.map(({ roomId }) => roomId));
                const room = rooms.find(({ id }) => !busyRoomIds.has(id));
                if (!room)
                    throw new common_1.ConflictException('No treatment room is available for that time');
                const phone = data.phone.trim();
                const existingCustomer = await transaction.customer.findUnique({ where: { phone } });
                const customer = existingCustomer ?? await transaction.customer.create({
                    data: {
                        firstName: data.firstName.trim(),
                        lastName: data.lastName.trim(),
                        phone,
                        email: data.email?.trim() || undefined,
                    },
                    select: { id: true },
                });
                return transaction.appointment.create({
                    data: {
                        customerId: customer.id,
                        locationId: location.id,
                        therapistId: therapist.userId,
                        roomId: room.id,
                        startsAt,
                        endsAt,
                        status: client_1.AppointmentStatus.PENDING,
                        notes: data.notes?.trim() || undefined,
                        services: {
                            create: services.map((service) => ({
                                serviceId: service.id,
                                name: service.name,
                                durationMinutes: service.durationMinutes ?? 0,
                                unitPriceKobo: service.priceKobo,
                            })),
                        },
                    },
                    select: {
                        id: true,
                        startsAt: true,
                        endsAt: true,
                        status: true,
                        services: { select: { name: true, unitPriceKobo: true, durationMinutes: true } },
                        location: { select: { name: true, city: true } },
                        therapist: { select: { firstName: true, lastName: true } },
                        room: { select: { name: true } },
                    },
                });
            }, { isolationLevel: client_1.Prisma.TransactionIsolationLevel.Serializable });
        }
        catch (error) {
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2034') {
                throw new common_1.ConflictException('That appointment time has just been taken. Please select another slot.');
            }
            throw error;
        }
    }
};
exports.PublicBookingService = PublicBookingService;
exports.PublicBookingService = PublicBookingService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PublicBookingService);
//# sourceMappingURL=public-booking.service.js.map