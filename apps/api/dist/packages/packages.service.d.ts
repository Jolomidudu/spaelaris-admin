import { PrismaService } from '../database/prisma.service';
export declare class PackagesService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    list(): import(".prisma/client").Prisma.PrismaPromise<{
        id: string;
        name: string;
        description: string | null;
        priceKobo: number;
        status: import(".prisma/client").$Enums.PackageStatus;
        validityDays: number | null;
        services: {
            quantity: number;
            service: {
                id: string;
                name: string;
                slug: string;
            };
        }[];
        _count: {
            memberships: number;
        };
    }[]>;
    create(data: {
        name: string;
        description?: string;
        priceNaira: number;
        validityDays?: number;
        serviceSlugs: string[];
    }): Promise<{
        id: string;
        name: string;
        description: string | null;
        priceKobo: number;
        status: import(".prisma/client").$Enums.PackageStatus;
        validityDays: number | null;
        services: {
            quantity: number;
            service: {
                id: string;
                name: string;
                slug: string;
            };
        }[];
        _count: {
            memberships: number;
        };
    }>;
}
