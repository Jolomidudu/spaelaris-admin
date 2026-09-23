import { MembershipsService } from './memberships.service';
declare class CreateMembershipDto {
    customerId: string;
    packageId: string;
    startsAt: string;
    validityDays?: number;
}
export declare class MembershipsController {
    private readonly membershipsService;
    constructor(membershipsService: MembershipsService);
    list(): import(".prisma/client").Prisma.PrismaPromise<{
        startsAt: Date;
        endsAt: Date | null;
        status: import(".prisma/client").$Enums.MembershipStatus;
        id: string;
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
    create(body: CreateMembershipDto): Promise<{
        startsAt: Date;
        endsAt: Date | null;
        status: import(".prisma/client").$Enums.MembershipStatus;
        id: string;
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
export {};
