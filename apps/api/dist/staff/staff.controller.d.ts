import { UserRole } from '@prisma/client';
import { StaffService } from './staff.service';
declare class CreateStaffDto {
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
}
declare class UpdateStaffAccessDto {
    role: UserRole;
    password: string;
}
declare class StaffAvailabilityDayDto {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
}
declare class UpdateStaffAvailabilityDto {
    availability: StaffAvailabilityDayDto[];
}
declare class UpdateStaffServicesDto {
    serviceSlugs: string[];
}
declare class UpdateStaffPhotoDto {
    photoUrl: string;
}
declare class UpdateStaffProfileDto {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string | null;
    locationSlug: string;
    role: UserRole;
    displayTitle: string;
    initialPassword?: string;
}
export declare class StaffController {
    private readonly staffService;
    constructor(staffService: StaffService);
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
    create(body: CreateStaffDto): Promise<{
        id: string;
        firstName: string;
        lastName: string;
        email: string;
    }>;
    updateAccess(id: string, body: UpdateStaffAccessDto): Promise<{
        status: import(".prisma/client").$Enums.UserStatus;
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        role: import(".prisma/client").$Enums.UserRole;
    }>;
    updateAvailability(id: string, body: UpdateStaffAvailabilityDto): Promise<{
        id: string;
        dayOfWeek: number;
        startTime: string;
        endTime: string;
    }[]>;
    updateServices(id: string, body: UpdateStaffServicesDto): Promise<{
        service: {
            id: string;
            name: string;
            slug: string;
        };
    }[]>;
    updatePhoto(id: string, body: UpdateStaffPhotoDto): import(".prisma/client").Prisma.Prisma__StaffProfileClient<{
        id: string;
        photoUrl: string | null;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, import(".prisma/client").Prisma.PrismaClientOptions>;
    updateProfile(id: string, body: UpdateStaffProfileDto): Promise<{
        id: string;
        user: {
            id: string;
            role: import(".prisma/client").$Enums.UserRole;
        };
        displayTitle: string | null;
    } | null>;
    remove(id: string): Promise<{
        status: import(".prisma/client").$Enums.UserStatus;
        id: string;
    }>;
}
export {};
