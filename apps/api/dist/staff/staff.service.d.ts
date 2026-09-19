import { PrismaService } from '../database/prisma.service';
export declare class StaffService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(data: {
        firstName: string;
        lastName: string;
        email: string;
        phone?: string;
        locationSlug: string;
        serviceSlugs: string[];
    }): Promise<{
        id: string;
        email: string;
        firstName: string;
        lastName: string;
    }>;
    list(): import(".prisma/client").Prisma.PrismaPromise<{
        user: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
            phone: string | null;
            role: import(".prisma/client").$Enums.UserRole;
            status: import(".prisma/client").$Enums.UserStatus;
        };
        location: {
            id: string;
            name: string;
            city: string;
        };
        id: string;
        bio: string | null;
        photoUrl: string | null;
        isBookable: boolean;
        services: {
            service: {
                id: string;
                name: string;
            };
        }[];
    }[]>;
}
