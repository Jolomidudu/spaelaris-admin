import { PrismaService } from '../database/prisma.service';
export declare class ServicesService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    list(): import(".prisma/client").Prisma.PrismaPromise<{
        isActive: boolean;
        id: string;
        name: string;
        slug: string;
        description: string | null;
        durationMinutes: number | null;
        priceKobo: number;
        category: {
            id: string;
            name: string;
            slug: string;
        };
    }[]>;
    createCategory(data: {
        name: string;
        description?: string;
    }): Promise<{
        id: string;
        name: string;
        slug: string;
        description: string | null;
    }>;
    update(id: string, data: {
        name?: string;
        categoryId?: string;
        description?: string;
        durationMinutes?: number;
        priceNaira?: number;
    }): Promise<{
        isActive: boolean;
        id: string;
        name: string;
        slug: string;
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
            isActive: boolean;
            id: string;
            name: string;
        };
    }>;
    create(data: {
        name: string;
        categoryId: string;
        description?: string;
        durationMinutes: number;
        priceNaira: number;
    }): Promise<{
        isActive: boolean;
        id: string;
        name: string;
        slug: string;
        description: string | null;
        durationMinutes: number | null;
        priceKobo: number;
        category: {
            id: string;
            name: string;
            slug: string;
        };
    }>;
    categories(): import(".prisma/client").Prisma.PrismaPromise<{
        id: string;
        name: string;
        slug: string;
    }[]>;
}
