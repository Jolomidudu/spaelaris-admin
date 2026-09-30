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
    create(body: CreateStaffDto): Promise<{
        firstName: string;
        lastName: string;
        email: string;
        id: string;
    }>;
    updateAccess(id: string, body: UpdateStaffAccessDto): Promise<{
        firstName: string;
        lastName: string;
        email: string;
        role: import(".prisma/client").$Enums.UserRole;
        id: string;
        status: import(".prisma/client").$Enums.UserStatus;
    }>;
    updateAvailability(id: string, body: UpdateStaffAvailabilityDto): Promise<{
        dayOfWeek: number;
        startTime: string;
        endTime: string;
        id: string;
    }[]>;
    updateServices(id: string, body: UpdateStaffServicesDto): Promise<{
        service: {
            id: string;
            name: string;
            slug: string;
        };
    }[]>;
    updatePhoto(id: string, body: UpdateStaffPhotoDto): import(".prisma/client").Prisma.Prisma__StaffProfileClient<{
        photoUrl: string | null;
        id: string;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, import(".prisma/client").Prisma.PrismaClientOptions>;
    updateProfile(id: string, body: UpdateStaffProfileDto): Promise<{
        displayTitle: string | null;
        id: string;
        user: {
            role: import(".prisma/client").$Enums.UserRole;
            id: string;
        };
    } | null>;
    remove(id: string): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.UserStatus;
    }>;
}
export {};
