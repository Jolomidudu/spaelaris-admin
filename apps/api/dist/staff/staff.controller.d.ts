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
}
export declare class StaffController {
    private readonly staffService;
    constructor(staffService: StaffService);
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
    create(body: CreateStaffDto): Promise<{
        id: string;
        email: string;
        firstName: string;
        lastName: string;
    }>;
    updateAccess(id: string, body: UpdateStaffAccessDto): Promise<{
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        role: import(".prisma/client").$Enums.UserRole;
        status: import(".prisma/client").$Enums.UserStatus;
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
            slug: string;
            name: string;
        };
    }[]>;
    updatePhoto(id: string, body: UpdateStaffPhotoDto): import(".prisma/client").Prisma.Prisma__StaffProfileClient<{
        id: string;
        photoUrl: string | null;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, import(".prisma/client").Prisma.PrismaClientOptions>;
    updateProfile(id: string, body: UpdateStaffProfileDto): Promise<{
        id: string;
        displayTitle: string | null;
        user: {
            id: string;
            role: import(".prisma/client").$Enums.UserRole;
        };
    } | null>;
    remove(id: string): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.UserStatus;
    }>;
}
export {};
