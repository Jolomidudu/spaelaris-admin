import { PaymentMethod, PaymentStatus } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
export declare class PaymentsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
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
        status: import(".prisma/client").$Enums.PaymentStatus;
        id: string;
        reference: string;
        amountKobo: number;
        method: import(".prisma/client").$Enums.PaymentMethod;
        paidAt: Date | null;
    }>;
    update(id: string, status: PaymentStatus): Promise<{
        status: import(".prisma/client").$Enums.PaymentStatus;
        id: string;
        reference: string;
        amountKobo: number;
        method: import(".prisma/client").$Enums.PaymentMethod;
        paidAt: Date | null;
        refundedAt: Date | null;
    }>;
    list(): import(".prisma/client").Prisma.PrismaPromise<{
        status: import(".prisma/client").$Enums.PaymentStatus;
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
        id: string;
        createdAt: Date;
        appointmentId: string;
        reference: string;
        amountKobo: number;
        method: import(".prisma/client").$Enums.PaymentMethod;
        paidAt: Date | null;
    }[]>;
}
