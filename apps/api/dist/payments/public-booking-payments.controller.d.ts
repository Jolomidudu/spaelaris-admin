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
            location: {
                name: string;
                city: string;
            };
            id: string;
            services: {
                name: string;
                durationMinutes: number;
                unitPriceKobo: number;
            }[];
            status: import(".prisma/client").$Enums.AppointmentStatus;
            room: {
                name: string;
            } | null;
            therapist: {
                firstName: string;
                lastName: string;
            } | null;
        };
    }>;
}
