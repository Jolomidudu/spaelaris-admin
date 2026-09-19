import { StaffService } from './staff.service';
declare class CreateStaffDto {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    locationSlug: string;
    serviceSlugs: string[];
}
export declare class StaffController {
    private readonly staffService;
    constructor(staffService: StaffService);
    list(): import(".prisma/client").Prisma.PrismaPromise<{
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
        id: string;
        bio: string | null;
        photoUrl: string | null;
        isBookable: boolean;
        services: {
            service: {
                id: string;
                name: string;
            };
        }[];
    }[]>;
    create(body: CreateStaffDto): Promise<{
        id: string;
        email: string;
        firstName: string;
        lastName: string;
    }>;
}
export {};
