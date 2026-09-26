import { DashboardService } from './dashboard.service';
export declare class DashboardController {
    private readonly dashboardService;
    constructor(dashboardService: DashboardService);
    summary(): Promise<{
        staff: number;
        services: number;
        categories: number;
        appointmentsToday: number;
        todaySchedule: {
            status: import(".prisma/client").$Enums.AppointmentStatus;
            id: string;
            services: {
                name: string;
            }[];
            startsAt: Date;
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
        }[];
        revenueTodayKobo: number;
        availableTherapists: number;
        pendingPaymentsKobo: number;
        pendingPaymentCount: number;
    }>;
}
