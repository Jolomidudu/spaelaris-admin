import { PaymentsService } from './payments.service';
type PaystackRequest = {
    headers: Record<string, string | string[] | undefined>;
    rawBody?: Buffer;
};
export declare class PaystackController {
    private readonly paymentsService;
    constructor(paymentsService: PaymentsService);
    webhook(request: PaystackRequest): Promise<{
        received: boolean;
    }>;
}
export {};
