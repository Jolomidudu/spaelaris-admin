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
    create(body: CreatePackageDto): Promise<{
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
export {};
