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
exports.PackagesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../database/prisma.service");
let PackagesService = class PackagesService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    list() {
        return this.prisma.package.findMany({
            where: { status: 'ACTIVE' },
            orderBy: { name: 'asc' },
            select: {
                id: true,
                name: true,
                description: true,
                priceKobo: true,
                validityDays: true,
                status: true,
                services: {
                    select: { quantity: true, service: { select: { id: true, name: true, slug: true } } },
                },
                _count: { select: { memberships: true } },
            },
        });
    }
    async create(data) {
        const name = data.name.trim();
        if (!name)
            throw new common_1.BadRequestException('Package name is required');
        if (data.priceNaira < 0)
            throw new common_1.BadRequestException('Price cannot be negative');
        if (!data.serviceSlugs.length)
            throw new common_1.BadRequestException('Select at least one service');
        const services = await this.prisma.service.findMany({
            where: { slug: { in: data.serviceSlugs }, isActive: true },
            select: { id: true },
        });
        if (services.length !== data.serviceSlugs.length)
            throw new common_1.BadRequestException('One or more services were not found');
        return this.prisma.package.create({
            data: {
                name,
                description: data.description?.trim() || undefined,
                priceKobo: Math.round(data.priceNaira * 100),
                validityDays: data.validityDays && data.validityDays > 0 ? data.validityDays : undefined,
                services: { create: services.map((service) => ({ serviceId: service.id })) },
            },
            select: {
                id: true,
                name: true,
                description: true,
                priceKobo: true,
                validityDays: true,
                status: true,
                services: { select: { quantity: true, service: { select: { id: true, name: true, slug: true } } } },
                _count: { select: { memberships: true } },
            },
        });
    }
};
exports.PackagesService = PackagesService;
exports.PackagesService = PackagesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PackagesService);
//# sourceMappingURL=packages.service.js.map