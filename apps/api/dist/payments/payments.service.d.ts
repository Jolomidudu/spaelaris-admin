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
        reference: string;
        amountKobo: number;
        method: import(".prisma/client").$Enums.PaymentMethod;
        paidAt: Date | null;
    }>;
    update(id: string, status: PaymentStatus): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.PaymentStatus;
        reference: string;
        amountKobo: number;
        method: import(".prisma/client").$Enums.PaymentMethod;
        paidAt: Date | null;
        refundedAt: Date | null;
    }>;
    list(): import(".prisma/client").Prisma.PrismaPromise<{
        id: string;
        createdAt: Date;
        status: import(".prisma/client").$Enums.PaymentStatus;
        appointment: {
            startsAt: Date;
            services: {
                name: string;
            }[];
            customer: {
                firstName: string;
                lastName: string;
                phone: string;
            };
        };
        appointmentId: string;
        reference: string;
        amountKobo: number;
        method: import(".prisma/client").$Enums.PaymentMethod;
        paidAt: Date | null;
    }[]>;
}
