import { PrismaService } from '../database/prisma.service';
export declare class RoomsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    list(): import(".prisma/client").Prisma.PrismaPromise<{
        id: string;
        name: string;
        description: string | null;
        isActive: boolean;
        location: {
            id: string;
            name: string;
            slug: string;
            city: string;
        };
        _count: {
            appointments: number;
        };
    }[]>;
    create(data: {
        name: string;
        locationSlug: string;
        description?: string;
    }): Promise<{
        id: string;
        name: string;
        description: string | null;
        isActive: boolean;
        location: {
            id: string;
            name: string;
            slug: string;
            city: string;
        };
        _count: {
            appointments: number;
        };
    }>;
}
