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
        displayTitle?: string;
        photoUrl?: string;
        locationSlug: string;
        serviceSlugs: string[];
        role?: UserRole;
        initialPassword?: string;
    }): Promise<{
        id: string;
        email: string;
        firstName: string;
        lastName: string;
    }>;
    updateAccess(id: string, data: {
        role: UserRole;
        password: string;
    }): Promise<{
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        role: import(".prisma/client").$Enums.UserRole;
        status: import(".prisma/client").$Enums.UserStatus;
    }>;
    updateAvailability(staffProfileId: string, availability: Array<{
        dayOfWeek: number;
        startTime: string;
        endTime: string;
    }>): Promise<{
        id: string;
        dayOfWeek: number;
        startTime: string;
        endTime: string;
    }[]>;
    updateServices(staffProfileId: string, serviceSlugs: string[]): Promise<{
        service: {
            id: string;
            slug: string;
            name: string;
        };
    }[]>;
    updatePhoto(staffProfileId: string, photoUrl: string): import(".prisma/client").Prisma.Prisma__StaffProfileClient<{
        id: string;
        photoUrl: string | null;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, import(".prisma/client").Prisma.PrismaClientOptions>;
    updateProfile(staffProfileId: string, data: {
        firstName: string;
        lastName: string;
        email: string;
        phone?: string | null;
        locationSlug: string;
        role: UserRole;
        displayTitle: string;
    }): Promise<{
        id: string;
        displayTitle: string | null;
        user: {
            id: string;
            role: import(".prisma/client").$Enums.UserRole;
        };
    } | null>;
    remove(staffProfileId: string): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.UserStatus;
    }>;
    list(): import(".prisma/client").Prisma.PrismaPromise<{
        id: string;
        bio: string | null;
        photoUrl: string | null;
        displayTitle: string | null;
        isBookable: boolean;
        location: {
            id: string;
            name: string;
            city: string;
        };
        services: {
            service: {
                id: string;
                slug: string;
                name: string;
            };
        }[];
        availability: {
            id: string;
            dayOfWeek: number;
            startTime: string;
            endTime: string;
        }[];
        user: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
            phone: string | null;
            role: import(".prisma/client").$Enums.UserRole;
            status: import(".prisma/client").$Enums.UserStatus;
        };
    }[]>;
}
