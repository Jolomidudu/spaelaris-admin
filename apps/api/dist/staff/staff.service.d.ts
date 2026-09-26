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
        firstName: string;
        lastName: string;
        email: string;
        id: string;
    }>;
    updateAccess(id: string, data: {
        role: UserRole;
        password: string;
    }): Promise<{
        firstName: string;
        lastName: string;
        email: string;
        role: import(".prisma/client").$Enums.UserRole;
        id: string;
        status: import(".prisma/client").$Enums.UserStatus;
    }>;
    updateAvailability(staffProfileId: string, availability: Array<{
        dayOfWeek: number;
        startTime: string;
        endTime: string;
    }>): Promise<{
        id: string;
        startTime: string;
        dayOfWeek: number;
        endTime: string;
    }[]>;
    list(): import(".prisma/client").Prisma.PrismaPromise<{
        id: string;
        bio: string | null;
        photoUrl: string | null;
        isBookable: boolean;
        user: {
            firstName: string;
            lastName: string;
            email: string;
            phone: string | null;
            role: import(".prisma/client").$Enums.UserRole;
            id: string;
            status: import(".prisma/client").$Enums.UserStatus;
        };
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
        availability: {
            id: string;
            startTime: string;
            dayOfWeek: number;
            endTime: string;
        }[];
    }[]>;
}
