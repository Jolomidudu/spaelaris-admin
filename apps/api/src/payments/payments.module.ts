import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { PaystackController } from './paystack.controller';

@Module({
  controllers: [PaymentsController, PaystackController],
  providers: [PaymentsService],
})
export class PaymentsModule {}