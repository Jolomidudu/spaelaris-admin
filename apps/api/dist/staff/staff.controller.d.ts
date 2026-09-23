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
}
export {};
