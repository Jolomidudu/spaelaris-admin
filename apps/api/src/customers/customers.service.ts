import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  create(data: {
    firstName: string;
    lastName: string;
    phone: string;
    email?: string;
  }) {
    return this.prisma.customer.create({
      data: {
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        phone: data.phone.trim(),
        email: data.email?.trim() || undefined,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        createdAt: true,
      },
    });
  }

  list() {
    return this.prisma.customer.findMany({
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        createdAt: true,
        _count: {
          select: {
            appointments: true,
            memberships: true,
          },
        },
        appointments: {
          orderBy: { startsAt: 'desc' },
          take: 1,
          select: {
            startsAt: true,
            status: true,
          },
        },
        memberships: {
          where: { status: 'ACTIVE' },
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            id: true,
            status: true,
            package: {
              select: { name: true },
            },
          },
        },
      },
    });
  }
}