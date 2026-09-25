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
export declare class StaffController {
    private readonly staffService;
    constructor(staffService: StaffService);
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
}
export {};
