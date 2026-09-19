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
exports.MembershipsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../database/prisma.service");
let MembershipsService = class MembershipsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    list() {
        return this.prisma.membership.findMany({
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                startsAt: true,
                endsAt: true,
                status: true,
                customer: { select: { id: true, firstName: true, lastName: true, phone: true, email: true } },
                package: { select: { id: true, name: true, priceKobo: true, validityDays: true } },
            },
        });
    }
    async create(data) {
        const [customer, packageRecord] = await Promise.all([
            this.prisma.customer.findUnique({ where: { id: data.customerId }, select: { id: true } }),
            this.prisma.package.findUnique({ where: { id: data.packageId }, select: { id: true, status: true, validityDays: true } }),
        ]);
        if (!customer)
            throw new common_1.BadRequestException('Customer was not found');
        if (!packageRecord || packageRecord.status !== 'ACTIVE')
            throw new common_1.BadRequestException('Package was not found');
        const startsAt = new Date(data.startsAt);
        if (Number.isNaN(startsAt.getTime()))
            throw new common_1.BadRequestException('Membership start date is invalid');
        const validityDays = data.validityDays || packageRecord.validityDays;
        const endsAt = validityDays ? new Date(startsAt.getTime() + validityDays * 24 * 60 * 60 * 1000) : undefined;
        return this.prisma.membership.create({
            data: { customerId: customer.id, packageId: packageRecord.id, startsAt, endsAt },
            select: {
                id: true,
                startsAt: true,
                endsAt: true,
                status: true,
                customer: { select: { id: true, firstName: true, lastName: true, phone: true, email: true } },
                package: { select: { id: true, name: true, priceKobo: true, validityDays: true } },
            },
        });
    }
};
exports.MembershipsService = MembershipsService;
exports.MembershipsService = MembershipsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], MembershipsService);
//# sourceMappingURL=memberships.service.js.map