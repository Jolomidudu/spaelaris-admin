import { PrismaService } from '../database/prisma.service';
export declare class ServicesService {
    private readonly prisma;
    constructor(prisma: PrismaService);
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
    create(data: {
        name: string;
        categoryId: string;
        description?: string;
        durationMinutes: number;
        priceNaira: number;
    }): Promise<{
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
    categories(): import(".prisma/client").Prisma.PrismaPromise<{
        id: string;
        name: string;
        slug: string;
    }[]>;
}
