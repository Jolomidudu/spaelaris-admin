import { PaymentsService } from './payments.service';
export declare class PublicBookingPaymentsController {
    private readonly paymentsService;
    constructor(paymentsService: PaymentsService);
    initialize(appointmentId: string): Promise<{
        reference: string;
        amountKobo: number;
        authorizationUrl: string;
    }>;
    verify(reference: string): Promise<{
        reference: string;
        status: import(".prisma/client").$Enums.PaymentStatus;
        amountKobo: number;
        appointment: {
            startsAt: Date;
            endsAt: Date;
            status: import(".prisma/client").$Enums.AppointmentStatus;
            id: string;
            location: {
                name: string;
                city: string;
            };
            therapist: {
                firstName: string;
                lastName: string;
            } | null;
            room: {
                name: string;
            } | null;
            services: {
                name: string;
                durationMinutes: number;
                unitPriceKobo: number;
            }[];
        };
    }>;
}
