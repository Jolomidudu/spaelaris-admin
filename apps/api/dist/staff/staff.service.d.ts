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
            name: string;
            slug: string;
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
        initialPassword?: string;
    }): Promise<{
        id: string;
        user: {
            id: string;
            role: import(".prisma/client").$Enums.UserRole;
        };
        displayTitle: string | null;
    } | null>;
    remove(staffProfileId: string): Promise<{
        status: import(".prisma/client").$Enums.UserStatus;
        id: string;
    }>;
    list(): Promise<{
        user: {
            passwordHash: undefined;
            hasPassword: boolean;
            status: import(".prisma/client").$Enums.UserStatus;
            id: string;
            firstName: string;
            lastName: string;
            email: string;
            phone: string | null;
            role: import(".prisma/client").$Enums.UserRole;
        };
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
                slug: string;
            };
        }[];
        photoUrl: string | null;
        bio: string | null;
        displayTitle: string | null;
        isBookable: boolean;
        availability: {
            id: string;
            dayOfWeek: number;
            startTime: string;
            endTime: string;
        }[];
    }[]>;
}
