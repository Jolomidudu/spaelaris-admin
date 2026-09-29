import { PrismaService } from '../database/prisma.service';
import { AuthenticatedUser } from '../auth/auth.types';
export declare class DashboardService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    summary(user?: AuthenticatedUser): Promise<{
        staff: number;
        services: number;
        categories: number;
        appointmentsToday: number;
        todaySchedule: {
            id: string;
            startsAt: Date;
            status: import(".prisma/client").$Enums.AppointmentStatus;
            customer: {
                firstName: string;
                lastName: string;
            };
            location: {
                name: string;
                city: string;
            };
            therapist: {
                firstName: string;
                lastName: string;
            } | null;
            services: {
                name: string;
            }[];
        }[];
        revenueTodayKobo: number;
        availableTherapists: number;
        pendingPaymentsKobo: number;
        pendingPaymentCount: number;
    }>;
}
