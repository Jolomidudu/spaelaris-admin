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
exports.CatalogService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../database/prisma.service");
let CatalogService = class CatalogService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    catalog() {
        return this.prisma.serviceCategory.findMany({
            where: { isActive: true },
            orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
            select: {
                id: true,
                name: true,
                slug: true,
                description: true,
                number: true,
                shortName: true,
                imageUrl: true,
                services: {
                    where: { isActive: true },
                    orderBy: { name: 'asc' },
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                        description: true,
                        details: true,
                        benefits: true,
                        includes: true,
                        durationMinutes: true,
                        priceKobo: true,
                        photoUrl: true,
                    },
                },
            },
        });
    }
    async therapists() {
        const profiles = await this.prisma.staffProfile.findMany({
            where: {
                isPubliclyListed: true,
                isBookable: true,
                publicSlug: { not: null },
                user: { status: 'ACTIVE', role: 'THERAPIST' },
            },
            orderBy: [{ location: { name: 'asc' } }, { user: { lastName: 'asc' } }],
            select: {
                id: true,
                publicSlug: true,
                displayTitle: true,
                bio: true,
                photoUrl: true,
                rating: true,
                reviewCount: true,
                completedAppointments: true,
                clientsServed: true,
                languages: true,
                location: { select: { name: true, slug: true, city: true } },
                user: { select: { firstName: true, lastName: true } },
                services: {
                    where: { service: { isActive: true, category: { isActive: true } } },
                    select: {
                        service: {
                            select: {
                                id: true,
                                name: true,
                                slug: true,
                                durationMinutes: true,
                                priceKobo: true,
                            },
                        },
                    },
                },
            },
        });
        return profiles.map(({ user, location, services, displayTitle, publicSlug, ...profile }) => ({
            ...profile,
            publicSlug: publicSlug,
            displayTitle,
            name: `${user.firstName} ${user.lastName}`,
            role: displayTitle ?? 'Therapist',
            city: `${location.city}, Nigeria`,
            location,
            services: services.map(({ service }) => service),
        }));
    }
};
exports.CatalogService = CatalogService;
exports.CatalogService = CatalogService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CatalogService);
//# sourceMappingURL=catalog.service.js.map