import { PrismaService } from '../database/prisma.service';
export declare class CustomersService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(data: {
        firstName: string;
        lastName: string;
        phone: string;
        email?: string;
    }): import(".prisma/client").Prisma.Prisma__CustomerClient<{
        id: string;
        email: string | null;
        firstName: string;
        lastName: string;
        phone: string;
        createdAt: Date;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, import(".prisma/client").Prisma.PrismaClientOptions>;
    list(): import(".prisma/client").Prisma.PrismaPromise<{
        id: string;
        email: string | null;
        firstName: string;
        lastName: string;
        phone: string;
        createdAt: Date;
        appointments: {
            status: import(".prisma/client").$Enums.AppointmentStatus;
            startsAt: Date;
        }[];
        _count: {
            appointments: number;
            memberships: number;
        };
        memberships: {
            package: {
                name: string;
            };
            id: string;
            status: import(".prisma/client").$Enums.MembershipStatus;
        }[];
    }[]>;
}
