import { PrismaService } from '../database/prisma.service';
export declare class MembershipsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    list(): import(".prisma/client").Prisma.PrismaPromise<{
        id: string;
        startsAt: Date;
        endsAt: Date | null;
        status: import(".prisma/client").$Enums.MembershipStatus;
        customer: {
            id: string;
            firstName: string;
            lastName: string;
            email: string | null;
            phone: string;
        };
        package: {
            id: string;
            name: string;
            priceKobo: number;
            validityDays: number | null;
        };
    }[]>;
    create(data: {
        customerId: string;
        packageId: string;
        startsAt: string;
        validityDays?: number;
    }): Promise<{
        id: string;
        startsAt: Date;
        endsAt: Date | null;
        status: import(".prisma/client").$Enums.MembershipStatus;
        customer: {
            id: string;
            firstName: string;
            lastName: string;
            email: string | null;
            phone: string;
        };
        package: {
            id: string;
            name: string;
            priceKobo: number;
            validityDays: number | null;
        };
    }>;
}
