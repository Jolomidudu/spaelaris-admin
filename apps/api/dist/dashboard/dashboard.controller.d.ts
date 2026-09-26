import { DashboardService } from './dashboard.service';
export declare class DashboardController {
    private readonly dashboardService;
    constructor(dashboardService: DashboardService);
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
