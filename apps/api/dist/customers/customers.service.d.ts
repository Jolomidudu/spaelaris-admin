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
        createdAt: Date;
        firstName: string;
        lastName: string;
        email: string | null;
        phone: string;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, import(".prisma/client").Prisma.PrismaClientOptions>;
    list(): import(".prisma/client").Prisma.PrismaPromise<{
        appointments: {
            startsAt: Date;
            status: import(".prisma/client").$Enums.AppointmentStatus;
        }[];
        id: string;
        createdAt: Date;
        _count: {
            appointments: number;
            memberships: number;
        };
        firstName: string;
        lastName: string;
        email: string | null;
        phone: string;
        memberships: {
            status: import(".prisma/client").$Enums.MembershipStatus;
            id: string;
            package: {
                name: string;
            };
        }[];
    }[]>;
}
