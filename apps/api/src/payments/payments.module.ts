import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { PaystackController } from './paystack.controller';

@Module({
  imports: [AuthModule],
  controllers: [PaymentsController, PaystackController],
  providers: [PaymentsService],
})
export class PaymentsModule {}