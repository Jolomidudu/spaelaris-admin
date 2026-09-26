import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { PaystackController } from './paystack.controller';
import { PublicBookingPaymentsController } from './public-booking-payments.controller';

@Module({
  imports: [AuthModule],
  controllers: [PaymentsController, PaystackController, PublicBookingPaymentsController],
  providers: [PaymentsService],
})
export class PaymentsModule {}