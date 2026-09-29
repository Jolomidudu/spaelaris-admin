import { AuthenticatedRequest } from '../auth/auth.types';
import { DashboardService } from './dashboard.service';
export declare class DashboardController {
    private readonly dashboardService;
    constructor(dashboardService: DashboardService);
    summary(request: AuthenticatedRequest): Promise<{
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
