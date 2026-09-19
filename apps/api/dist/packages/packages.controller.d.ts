import { PackagesService } from './packages.service';
declare class CreatePackageDto {
    name: string;
    description?: string;
    priceNaira: number;
    validityDays?: number;
    serviceSlugs: string[];
}
export declare class PackagesController {
    private readonly packagesService;
    constructor(packagesService: PackagesService);
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
    create(body: CreatePackageDto): Promise<{
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
export {};
