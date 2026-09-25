import { PrismaService } from '../database/prisma.service';
export declare class RoomsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    list(): import(".prisma/client").Prisma.PrismaPromise<{
        id: string;
        location: {
            id: string;
            name: string;
            slug: string;
            city: string;
        };
        _count: {
            appointments: number;
        };
        name: string;
        isActive: boolean;
        description: string | null;
    }[]>;
    create(data: {
        name: string;
        locationSlug: string;
        description?: string;
    }): Promise<{
        id: string;
        location: {
            id: string;
            name: string;
            slug: string;
            city: string;
        };
        _count: {
            appointments: number;
        };
        name: string;
        isActive: boolean;
        description: string | null;
    }>;
}
