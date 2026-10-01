import { PrismaService } from '../database/prisma.service';
export declare class ServicesService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    list(): import(".prisma/client").Prisma.PrismaPromise<{
        id: string;
        photoUrl: string | null;
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
    createCategory(data: {
        name: string;
        description?: string;
        imageUrl?: string;
    }): Promise<{
        id: string;
        name: string;
        slug: string;
        description: string | null;
        imageUrl: string | null;
    }>;
    updateCategory(id: string, data: {
        name?: string;
        description?: string;
        imageUrl?: string;
    }): Promise<{
        id: string;
        name: string;
        slug: string;
        description: string | null;
        imageUrl: string | null;
    }>;
    removeCategory(id: string): Promise<{
        success: boolean;
    }>;
    update(id: string, data: {
        name?: string;
        categoryId?: string;
        description?: string;
        photoUrl?: string;
        durationMinutes?: number;
        priceNaira?: number;
    }): Promise<{
        id: string;
        photoUrl: string | null;
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
    create(data: {
        name: string;
        categoryId: string;
        description?: string;
        photoUrl?: string;
        durationMinutes: number;
        priceNaira: number;
    }): Promise<{
        id: string;
        photoUrl: string | null;
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
    categories(): import(".prisma/client").Prisma.PrismaPromise<{
        id: string;
        name: string;
        slug: string;
        description: string | null;
        imageUrl: string | null;
    }[]>;
}
