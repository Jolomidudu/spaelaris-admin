import { PaymentMethod, PaymentStatus } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
export declare class PaymentsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    initializeAppointmentPayment(appointmentId: string): Promise<{
        reference: string;
        amountKobo: number;
        authorizationUrl: string;
    }>;
    verifyAppointmentPayment(reference: string): Promise<{
        reference: string;
        status: import(".prisma/client").$Enums.PaymentStatus;
        amountKobo: number;
        appointment: {
            id: string;
            startsAt: Date;
            endsAt: Date;
            status: import(".prisma/client").$Enums.AppointmentStatus;
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
    initialize(data: {
        appointmentId: string;
        reference: string;
        amountKobo: number;
        email: string;
        method?: PaymentMethod;
        status?: PaymentStatus;
    }): Promise<unknown>;
    handleWebhook(signature: string, rawBody: Buffer): Promise<{
        received: boolean;
    }>;
    create(data: {
        appointmentId: string;
        reference: string;
        amountKobo: number;
        method?: PaymentMethod;
        status?: PaymentStatus;
    }): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.PaymentStatus;
        method: import(".prisma/client").$Enums.PaymentMethod;
        reference: string;
        amountKobo: number;
        paidAt: Date | null;
    }>;
    update(id: string, status: PaymentStatus): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.PaymentStatus;
        method: import(".prisma/client").$Enums.PaymentMethod;
        reference: string;
        amountKobo: number;
        paidAt: Date | null;
        refundedAt: Date | null;
    }>;
    list(): import(".prisma/client").Prisma.PrismaPromise<{
        id: string;
        status: import(".prisma/client").$Enums.PaymentStatus;
        createdAt: Date;
        appointment: {
            startsAt: Date;
            customer: {
                firstName: string;
                lastName: string;
                phone: string;
            };
            services: {
                name: string;
            }[];
        };
        appointmentId: string;
        method: import(".prisma/client").$Enums.PaymentMethod;
        reference: string;
        amountKobo: number;
        paidAt: Date | null;
    }[]>;
}
