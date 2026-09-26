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
exports.StaffService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const bcrypt = require("bcrypt");
const prisma_service_1 = require("../database/prisma.service");
let StaffService = class StaffService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(data) {
        const location = await this.prisma.location.findUnique({ where: { slug: data.locationSlug } });
        if (!location) {
            throw new common_1.BadRequestException('Location not found');
        }
        const services = await this.prisma.service.findMany({
            where: { slug: { in: data.serviceSlugs }, isActive: true },
            select: { id: true },
        });
        if (services.length !== data.serviceSlugs.length) {
            throw new common_1.BadRequestException('One or more services were not found');
        }
        const role = data.role ?? client_1.UserRole.THERAPIST;
        if (role !== client_1.UserRole.THERAPIST && !data.initialPassword) {
            throw new common_1.BadRequestException('An initial password is required for admin staff accounts');
        }
        const existingUser = await this.prisma.user.findUnique({ where: { email: data.email.trim().toLowerCase() } });
        if (existingUser) {
            throw new common_1.ConflictException('A user with this email already exists');
        }
        const user = await this.prisma.user.create({
            data: {
                firstName: data.firstName.trim(),
                lastName: data.lastName.trim(),
                email: data.email.trim().toLowerCase(),
                phone: data.phone?.trim() || undefined,
                role,
                status: 'ACTIVE',
                passwordHash: data.initialPassword
                    ? await bcrypt.hash(data.initialPassword, 12)
                    : undefined,
                staffProfile: {
                    create: {
                        locationId: location.id,
                        services: {
                            create: services.map((service) => ({ serviceId: service.id })),
                        },
                    },
                },
            },
            select: { id: true, firstName: true, lastName: true, email: true },
        });
        return user;
    }
    async updateAccess(id, data) {
        const user = await this.prisma.user.findUnique({ where: { id } });
        if (!user)
            throw new common_1.BadRequestException('Staff user was not found');
        return this.prisma.user.update({
            where: { id },
            data: {
                role: data.role,
                status: 'ACTIVE',
                passwordHash: await bcrypt.hash(data.password, 12),
            },
            select: { id: true, firstName: true, lastName: true, email: true, role: true, status: true },
        });
    }
    async updateAvailability(staffProfileId, availability) {
        const profile = await this.prisma.staffProfile.findUnique({
            where: { id: staffProfileId },
            select: { id: true, user: { select: { role: true } } },
        });
        if (!profile || profile.user.role !== client_1.UserRole.THERAPIST) {
            throw new common_1.BadRequestException('Therapist profile was not found');
        }
        const byDay = new Map();
        for (const entry of availability) {
            const start = Number(entry.startTime.slice(0, 2)) * 60 + Number(entry.startTime.slice(3));
            const end = Number(entry.endTime.slice(0, 2)) * 60 + Number(entry.endTime.slice(3));
            if (end <= start)
                throw new common_1.BadRequestException('Availability end time must be later than start time');
            const dayEntries = byDay.get(entry.dayOfWeek) ?? [];
            if (dayEntries.some((range) => start < range.end && end > range.start)) {
                throw new common_1.BadRequestException('Availability periods cannot overlap on the same day');
            }
            dayEntries.push({ start, end });
            byDay.set(entry.dayOfWeek, dayEntries);
        }
        await this.prisma.$transaction(async (transaction) => {
            await transaction.staffAvailability.deleteMany({ where: { staffProfileId } });
            if (availability.length > 0) {
                await transaction.staffAvailability.createMany({
                    data: availability.map((entry) => ({ staffProfileId, ...entry })),
                });
            }
        });
        return this.prisma.staffAvailability.findMany({
            where: { staffProfileId },
            orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
            select: { id: true, dayOfWeek: true, startTime: true, endTime: true },
        });
    }
    list() {
        return this.prisma.staffProfile.findMany({
            where: {
                user: {
                    status: 'ACTIVE',
                },
            },
            orderBy: [
                { location: { name: 'asc' } },
                { user: { lastName: 'asc' } },
            ],
            select: {
                id: true,
                bio: true,
                photoUrl: true,
                isBookable: true,
                availability: {
                    orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
                    select: { id: true, dayOfWeek: true, startTime: true, endTime: true },
                },
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        phone: true,
                        role: true,
                        status: true,
                    },
                },
                location: {
                    select: {
                        id: true,
                        name: true,
                        city: true,
                    },
                },
                services: {
                    select: {
                        service: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                    },
                },
            },
        });
    }
};
exports.StaffService = StaffService;
exports.StaffService = StaffService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], StaffService);
//# sourceMappingURL=staff.service.js.map