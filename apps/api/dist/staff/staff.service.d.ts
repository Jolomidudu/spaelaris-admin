import { UserRole } from '@prisma/client';
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
        role?: UserRole;
        initialPassword?: string;
    }): Promise<{
        id: string;
        firstName: string;
        lastName: string;
        email: string;
    }>;
    updateAccess(id: string, data: {
        role: UserRole;
        password: string;
    }): Promise<{
        status: import(".prisma/client").$Enums.UserStatus;
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        role: import(".prisma/client").$Enums.UserRole;
    }>;
    list(): import(".prisma/client").Prisma.PrismaPromise<{
        id: string;
        location: {
            id: string;
            name: string;
            city: string;
        };
        services: {
            service: {
                id: string;
                name: string;
            };
        }[];
        photoUrl: string | null;
        user: {
            status: import(".prisma/client").$Enums.UserStatus;
            id: string;
            firstName: string;
            lastName: string;
            email: string;
            phone: string | null;
            role: import(".prisma/client").$Enums.UserRole;
        };
        bio: string | null;
        isBookable: boolean;
    }[]>;
}
