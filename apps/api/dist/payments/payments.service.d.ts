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
        appointment: {
            customer: {
                firstName: string;
                lastName: string;
                phone: string;
            };
            services: {
                name: string;
            }[];
            startsAt: Date;
        };
        id: string;
        status: import(".prisma/client").$Enums.PaymentStatus;
        createdAt: Date;
        appointmentId: string;
        reference: string;
        amountKobo: number;
        method: import(".prisma/client").$Enums.PaymentMethod;
        paidAt: Date | null;
    }[]>;
}
