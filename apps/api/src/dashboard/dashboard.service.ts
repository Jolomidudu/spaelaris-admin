import { Injectable } from '@nestjs/common';
import { UserRole, UserStatus } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async summary() {
    const [staff, services, categories] = await Promise.all([
      this.prisma.user.count({
        where: {
          status: UserStatus.ACTIVE,
          role: { in: [UserRole.MANAGER, UserRole.RECEPTIONIST, UserRole.THERAPIST] },
        },
      }),
      this.prisma.service.count({
        where: { isActive: true, category: { isActive: true } },
      }),
      this.prisma.serviceCategory.count({ where: { isActive: true } }),
    ]);

    return { staff, services, categories };
  }
}
