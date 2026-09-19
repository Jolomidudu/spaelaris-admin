import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class MembershipsService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.membership.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        startsAt: true,
        endsAt: true,
        status: true,
        customer: { select: { id: true, firstName: true, lastName: true, phone: true, email: true } },
        package: { select: { id: true, name: true, priceKobo: true, validityDays: true } },
      },
    });
  }

  async create(data: { customerId: string; packageId: string; startsAt: string; validityDays?: number }) {
    const [customer, packageRecord] = await Promise.all([
      this.prisma.customer.findUnique({ where: { id: data.customerId }, select: { id: true } }),
      this.prisma.package.findUnique({ where: { id: data.packageId }, select: { id: true, status: true, validityDays: true } }),
    ]);

    if (!customer) throw new BadRequestException('Customer was not found');
    if (!packageRecord || packageRecord.status !== 'ACTIVE') throw new BadRequestException('Package was not found');

    const startsAt = new Date(data.startsAt);
    if (Number.isNaN(startsAt.getTime())) throw new BadRequestException('Membership start date is invalid');

    const validityDays = data.validityDays || packageRecord.validityDays;
    const endsAt = validityDays ? new Date(startsAt.getTime() + validityDays * 24 * 60 * 60 * 1000) : undefined;

    return this.prisma.membership.create({
      data: { customerId: customer.id, packageId: packageRecord.id, startsAt, endsAt },
      select: {
        id: true,
        startsAt: true,
        endsAt: true,
        status: true,
        customer: { select: { id: true, firstName: true, lastName: true, phone: true, email: true } },
        package: { select: { id: true, name: true, priceKobo: true, validityDays: true } },
      },
    });
  }
}
