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
exports.DashboardService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../database/prisma.service");
function getLocalDayRange(timeZone, now) {
    const dateLabel = new Intl.DateTimeFormat('en-CA', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).format(now);
    const localMidnightUtc = new Date(`${dateLabel}T00:00:00.000Z`);
    const offsetAt = (date) => {
        const parts = new Intl.DateTimeFormat('en-GB', {
            timeZone,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hourCycle: 'h23',
        }).formatToParts(date);
        const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
        return Date.UTC(Number(values.year), Number(values.month) - 1, Number(values.day), Number(values.hour), Number(values.minute), Number(values.second)) - date.getTime();
    };
    const start = new Date(localMidnightUtc.getTime() - offsetAt(localMidnightUtc));
    const nextMidnight = new Date(localMidnightUtc.getTime() + 24 * 60 * 60 * 1000);
    const end = new Date(nextMidnight.getTime() - offsetAt(nextMidnight));
    return { start, end };
}
let DashboardService = class DashboardService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async summary() {
        const now = new Date();
        const { start: todayStart, end: todayEnd } = getLocalDayRange('Africa/Lagos', now);
        const [staff, services, categories, appointmentsToday, revenueToday, availableTherapists, pendingPayments] = await Promise.all([
            this.prisma.user.count({
                where: {
                    status: client_1.UserStatus.ACTIVE,
                    role: { in: [client_1.UserRole.MANAGER, client_1.UserRole.RECEPTIONIST, client_1.UserRole.THERAPIST] },
                },
            }),
            this.prisma.service.count({
                where: { isActive: true, category: { isActive: true } },
            }),
            this.prisma.serviceCategory.count({ where: { isActive: true } }),
            this.prisma.appointment.count({
                where: {
                    startsAt: { gte: todayStart, lt: todayEnd },
                    status: { notIn: [client_1.AppointmentStatus.CANCELLED, client_1.AppointmentStatus.NO_SHOW] },
                },
            }),
            this.prisma.payment.aggregate({
                where: { status: client_1.PaymentStatus.PAID, paidAt: { gte: todayStart, lt: todayEnd } },
                _sum: { amountKobo: true },
            }),
            this.prisma.staffProfile.count({
                where: {
                    isBookable: true,
                    location: { isActive: true },
                    timeOff: { none: { startsAt: { lte: now }, endsAt: { gt: now } } },
                    user: {
                        status: client_1.UserStatus.ACTIVE,
                        role: client_1.UserRole.THERAPIST,
                        appointments: {
                            none: {
                                startsAt: { lte: now },
                                endsAt: { gt: now },
                                status: { notIn: [client_1.AppointmentStatus.CANCELLED, client_1.AppointmentStatus.NO_SHOW] },
                            },
                        },
                    },
                },
            }),
            this.prisma.payment.aggregate({
                where: { status: client_1.PaymentStatus.PENDING },
                _sum: { amountKobo: true },
                _count: { _all: true },
            }),
        ]);
        return {
            staff,
            services,
            categories,
            appointmentsToday,
            revenueTodayKobo: revenueToday._sum.amountKobo ?? 0,
            availableTherapists,
            pendingPaymentsKobo: pendingPayments._sum.amountKobo ?? 0,
            pendingPaymentCount: pendingPayments._count._all,
        };
    }
};
exports.DashboardService = DashboardService;
exports.DashboardService = DashboardService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DashboardService);
//# sourceMappingURL=dashboard.service.js.map