import { PrismaService } from '../database/prisma.service';
export declare class PackagesService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    list(): import(".prisma/client").Prisma.PrismaPromise<{
        status: import(".prisma/client").$Enums.PackageStatus;
        id: string;
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
        name: string;
        description: string | null;
        priceKobo: number;
        validityDays: number | null;
    }[]>;
    create(data: {
        name: string;
        description?: string;
        priceNaira: number;
        validityDays?: number;
        serviceSlugs: string[];
    }): Promise<{
        status: import(".prisma/client").$Enums.PackageStatus;
        id: string;
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
        name: string;
        description: string | null;
        priceKobo: number;
        validityDays: number | null;
    }>;
}
