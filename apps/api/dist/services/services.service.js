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
exports.ServicesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../database/prisma.service");
let ServicesService = class ServicesService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    list() {
        return this.prisma.service.findMany({
            where: { isActive: true },
            orderBy: [{ category: { sortOrder: 'asc' } }, { name: 'asc' }],
            select: {
                id: true,
                name: true,
                slug: true,
                description: true,
                durationMinutes: true,
                priceKobo: true,
                isActive: true,
                category: { select: { id: true, name: true, slug: true } },
            },
        });
    }
    async create(data) {
        const category = await this.prisma.serviceCategory.findUnique({
            where: { id: data.categoryId },
        });
        if (!category || !category.isActive) {
            throw new common_1.BadRequestException('Service category was not found');
        }
        const name = data.name.trim();
        if (!name)
            throw new common_1.BadRequestException('Service name is required');
        if (data.durationMinutes < 1)
            throw new common_1.BadRequestException('Duration must be at least one minute');
        if (data.priceNaira < 0)
            throw new common_1.BadRequestException('Price cannot be negative');
        const slug = `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}-${Date.now()}`;
        return this.prisma.service.create({
            data: {
                name,
                slug,
                categoryId: category.id,
                description: data.description?.trim() || undefined,
                durationMinutes: data.durationMinutes,
                priceKobo: Math.round(data.priceNaira * 100),
            },
            select: {
                id: true,
                name: true,
                slug: true,
                description: true,
                durationMinutes: true,
                priceKobo: true,
                isActive: true,
                category: { select: { id: true, name: true, slug: true } },
            },
        });
    }
    categories() {
        return this.prisma.serviceCategory.findMany({
            where: { isActive: true },
            orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
            select: { id: true, name: true, slug: true },
        });
    }
};
exports.ServicesService = ServicesService;
exports.ServicesService = ServicesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ServicesService);
//# sourceMappingURL=services.service.js.map