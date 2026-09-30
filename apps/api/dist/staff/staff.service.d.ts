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
        dayOfWeek: number;
        startTime: string;
        endTime: string;
        id: string;
    }[]>;
    updateServices(staffProfileId: string, serviceSlugs: string[]): Promise<{
        service: {
            id: string;
            name: string;
            slug: string;
        };
    }[]>;
    updatePhoto(staffProfileId: string, photoUrl: string): import(".prisma/client").Prisma.Prisma__StaffProfileClient<{
        photoUrl: string | null;
        id: string;
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
        displayTitle: string | null;
        id: string;
        user: {
            role: import(".prisma/client").$Enums.UserRole;
            id: string;
        };
    } | null>;
    remove(staffProfileId: string): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.UserStatus;
    }>;
    list(): Promise<{
        user: {
            passwordHash: undefined;
            hasPassword: boolean;
            firstName: string;
            lastName: string;
            email: string;
            phone: string | null;
            role: import(".prisma/client").$Enums.UserRole;
            id: string;
            status: import(".prisma/client").$Enums.UserStatus;
        };
        displayTitle: string | null;
        photoUrl: string | null;
        availability: {
            dayOfWeek: number;
            startTime: string;
            endTime: string;
            id: string;
        }[];
        id: string;
        bio: string | null;
        isBookable: boolean;
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
    }[]>;
}
