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
exports.RoomsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../database/prisma.service");
let RoomsService = class RoomsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    list() {
        return this.prisma.room.findMany({
            where: { isActive: true },
            orderBy: [{ location: { name: 'asc' } }, { name: 'asc' }],
            select: {
                id: true,
                name: true,
                description: true,
                photoUrl: true,
                isActive: true,
                location: { select: { id: true, name: true, slug: true, city: true } },
                _count: { select: { appointments: true } },
            },
        });
    }
    async create(data) {
        const location = await this.prisma.location.findUnique({ where: { slug: data.locationSlug } });
        if (!location || !location.isActive)
            throw new common_1.BadRequestException('Location was not found');
        const name = data.name.trim();
        if (!name)
            throw new common_1.BadRequestException('Room name is required');
        const existingRoom = await this.prisma.room.findUnique({ where: { locationId_name: { locationId: location.id, name } } });
        if (existingRoom)
            throw new common_1.ConflictException('A room with this name already exists at this location');
        return this.prisma.room.create({
            data: {
                locationId: location.id,
                name,
                description: data.description?.trim() || undefined,
                photoUrl: data.photoUrl?.trim() || undefined,
            },
            select: {
                id: true,
                name: true,
                description: true,
                photoUrl: true,
                isActive: true,
                location: { select: { id: true, name: true, slug: true, city: true } },
                _count: { select: { appointments: true } },
            },
        });
    }
    async update(id, data) {
        const room = await this.prisma.room.findUnique({
            where: { id },
            select: { id: true, name: true, locationId: true, isActive: true },
        });
        if (!room || !room.isActive)
            throw new common_1.BadRequestException('Room was not found');
        const name = data.name?.trim();
        if (name !== undefined && !name)
            throw new common_1.BadRequestException('Room name is required');
        let locationId = room.locationId;
        if (data.locationSlug) {
            const location = await this.prisma.location.findUnique({ where: { slug: data.locationSlug } });
            if (!location || !location.isActive)
                throw new common_1.BadRequestException('Location was not found');
            locationId = location.id;
        }
        if ((name && name !== room.name) || locationId !== room.locationId) {
            const existingRoom = await this.prisma.room.findFirst({
                where: { id: { not: id }, locationId, name: name ?? room.name },
                select: { id: true },
            });
            if (existingRoom)
                throw new common_1.ConflictException('A room with this name already exists at this location');
        }
        return this.prisma.room.update({
            where: { id },
            data: {
                name,
                locationId: data.locationSlug ? locationId : undefined,
                description: data.description === undefined ? undefined : data.description?.trim() || null,
                photoUrl: data.photoUrl === undefined ? undefined : data.photoUrl?.trim() || null,
            },
            select: {
                id: true,
                name: true,
                description: true,
                photoUrl: true,
                isActive: true,
                location: { select: { id: true, name: true, slug: true, city: true } },
                _count: { select: { appointments: true } },
            },
        });
    }
    async remove(id) {
        const room = await this.prisma.room.findUnique({ where: { id }, select: { id: true, isActive: true } });
        if (!room || !room.isActive)
            throw new common_1.BadRequestException('Room was not found');
        await this.prisma.room.update({ where: { id }, data: { isActive: false } });
        return { success: true };
    }
};
exports.RoomsService = RoomsService;
exports.RoomsService = RoomsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], RoomsService);
//# sourceMappingURL=rooms.service.js.map