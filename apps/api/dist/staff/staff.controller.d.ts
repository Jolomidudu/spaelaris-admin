import { UserRole } from '@prisma/client';
import { StaffService } from './staff.service';
declare class CreateStaffDto {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
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
export declare class StaffController {
    private readonly staffService;
    constructor(staffService: StaffService);
    list(): import(".prisma/client").Prisma.PrismaPromise<{
        id: string;
        bio: string | null;
        photoUrl: string | null;
        isBookable: boolean;
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
        startTime: string;
        dayOfWeek: number;
        endTime: string;
    }[]>;
}
export {};
