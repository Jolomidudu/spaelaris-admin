import { Controller, Post, Req, UnauthorizedException } from '@nestjs/common';
import { PaymentsService } from './payments.service';

type PaystackRequest = { headers: Record<string, string | string[] | undefined>; rawBody?: Buffer };

@Controller('payments')
export class PaystackController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('webhook')
  webhook(@Req() request: PaystackRequest) {
    const signature = request.headers['x-paystack-signature'];
    if (typeof signature !== 'string' || !request.rawBody) {
      throw new UnauthorizedException('Paystack signature required');
    }

    return this.paymentsService.handleWebhook(signature, request.rawBody);
  }
}