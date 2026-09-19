import { ServicesService } from './services.service';
declare class CreateServiceDto {
    name: string;
    categoryId: string;
    description?: string;
    durationMinutes: number;
    priceNaira: number;
}
export declare class ServicesController {
    private readonly servicesService;
    constructor(servicesService: ServicesService);
    list(): import(".prisma/client").Prisma.PrismaPromise<{
        id: string;
        name: string;
        slug: string;
        description: string | null;
        durationMinutes: number;
        priceKobo: number;
        isActive: boolean;
        category: {
            id: string;
            name: string;
            slug: string;
        };
    }[]>;
    categories(): import(".prisma/client").Prisma.PrismaPromise<{
        id: string;
        name: string;
        slug: string;
    }[]>;
    create(body: CreateServiceDto): Promise<{
        id: string;
        name: string;
        slug: string;
        description: string | null;
        durationMinutes: number;
        priceKobo: number;
        isActive: boolean;
        category: {
            id: string;
            name: string;
            slug: string;
        };
    }>;
}
export {};
