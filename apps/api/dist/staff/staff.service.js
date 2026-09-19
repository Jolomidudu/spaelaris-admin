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
                role: 'THERAPIST',
                status: 'ACTIVE',
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