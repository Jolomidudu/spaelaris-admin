import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './database/prisma.module';
import { HealthController } from './health/health.controller';
import { StaffModule } from './staff/staff.module';
import { CustomersModule } from './customers/customers.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { PaymentsModule } from './payments/payments.module';
import { ServicesModule } from './services/services.module';
import { RoomsModule } from './rooms/rooms.module';
import { PackagesModule } from './packages/packages.module';
import { MembershipsModule } from './memberships/memberships.module';
import { CatalogModule } from './catalog/catalog.module';
import { DashboardModule } from './dashboard/dashboard.module';

@Module({
  imports: [PrismaModule, AuthModule, StaffModule, CustomersModule, AppointmentsModule, PaymentsModule, ServicesModule, RoomsModule, PackagesModule, MembershipsModule, CatalogModule, DashboardModule],
  controllers: [HealthController],
})
export class AppModule {}
