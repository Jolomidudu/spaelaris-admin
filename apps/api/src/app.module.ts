import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './database/prisma.module';
import { HealthController } from './health/health.controller';
import { StaffModule } from './staff/staff.module';
import { CustomersModule } from './customers/customers.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { PaymentsModule } from './payments/payments.module';
import { ServicesModule } from './services/services.module';

@Module({
  imports: [PrismaModule, AuthModule, StaffModule, CustomersModule, AppointmentsModule, PaymentsModule, ServicesModule],
  controllers: [HealthController],
})
export class AppModule {}
