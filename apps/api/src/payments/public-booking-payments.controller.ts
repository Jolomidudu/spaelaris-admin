import { Controller, Get, Param, Post } from '@nestjs/common';
import { PaymentsService } from './payments.service';

@Controller('public/booking')
export class PublicBookingPaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post(':appointmentId/payment')
  initialize(@Param('appointmentId') appointmentId: string) {
    return this.paymentsService.initializeAppointmentPayment(appointmentId);
  }

  @Get('payment/:reference')
  verify(@Param('reference') reference: string) {
    return this.paymentsService.verifyAppointmentPayment(reference);
  }
}
