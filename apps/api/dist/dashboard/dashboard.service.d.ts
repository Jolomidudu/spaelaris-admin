import { PrismaService } from '../database/prisma.service';
export declare class DashboardService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    summary(): Promise<{
        staff: number;
        services: number;
        categories: number;
        appointmentsToday: number;
        revenueTodayKobo: number;
        availableTherapists: number;
        pendingPaymentsKobo: number;
        pendingPaymentCount: number;
    }>;
}
