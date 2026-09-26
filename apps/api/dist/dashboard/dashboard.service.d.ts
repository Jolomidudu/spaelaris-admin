import { PrismaService } from '../database/prisma.service';
export declare class DashboardService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    summary(): Promise<{
        staff: number;
        services: number;
        categories: number;
    }>;
}
