import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './database/prisma.module';
import { HealthController } from './health/health.controller';
import { StaffModule } from './staff/staff.module';
import { CustomersModule } from './customers/customers.module';

@Module({
  imports: [PrismaModule, AuthModule, StaffModule, CustomersModule],
  controllers: [HealthController],
})
export class AppModule {}
