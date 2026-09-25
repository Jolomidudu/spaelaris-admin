import { ServicesService } from './services.service';
declare class CreateServiceCategoryDto {
    name: string;
    description?: string;
}
declare class CreateServiceDto {
    name: string;
    categoryId: string;
    description?: string;
    durationMinutes: number;
    priceNaira: number;
}
declare class UpdateServiceDto {
    name?: string;
    categoryId?: string;
    description?: string;
    durationMinutes?: number;
    priceNaira?: number;
}
export declare class ServicesController {
    private readonly servicesService;
    constructor(servicesService: ServicesService);
    list(): import(".prisma/client").Prisma.PrismaPromise<{
        id: string;
        name: string;
        slug: string;
        isActive: boolean;
        description: string | null;
        durationMinutes: number | null;
        priceKobo: number;
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
    createCategory(body: CreateServiceCategoryDto): Promise<{
        id: string;
        name: string;
        slug: string;
        description: string | null;
    }>;
    create(body: CreateServiceDto): Promise<{
        id: string;
        name: string;
        slug: string;
        isActive: boolean;
        description: string | null;
        durationMinutes: number | null;
        priceKobo: number;
        category: {
            id: string;
            name: string;
            slug: string;
        };
    }>;
    update(id: string, body: UpdateServiceDto): Promise<{
        id: string;
        name: string;
        slug: string;
        isActive: boolean;
        description: string | null;
        durationMinutes: number | null;
        priceKobo: number;
        category: {
            id: string;
            name: string;
            slug: string;
        };
    }>;
    remove(id: string): Promise<{
        success: boolean;
        service: {
            id: string;
            name: string;
            isActive: boolean;
        };
    }>;
}
export {};
