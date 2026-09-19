import { PaymentMethod, PaymentStatus } from '@prisma/client';
import { PaymentsService } from './payments.service';
declare class CreatePaymentDto {
    appointmentId: string;
    reference: string;
    amountKobo: number;
    method?: PaymentMethod;
    status?: PaymentStatus;
}
declare class UpdatePaymentDto {
    status: PaymentStatus;
}
declare class InitializePaymentDto extends CreatePaymentDto {
    email: string;
}
export declare class PaymentsController {
    private readonly paymentsService;
    constructor(paymentsService: PaymentsService);
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
    create(body: CreatePaymentDto): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.PaymentStatus;
        reference: string;
        amountKobo: number;
        method: import(".prisma/client").$Enums.PaymentMethod;
        paidAt: Date | null;
    }>;
    initialize(body: InitializePaymentDto): Promise<unknown>;
    update(id: string, body: UpdatePaymentDto): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.PaymentStatus;
        reference: string;
        amountKobo: number;
        method: import(".prisma/client").$Enums.PaymentMethod;
        paidAt: Date | null;
        refundedAt: Date | null;
    }>;
}
export {};
