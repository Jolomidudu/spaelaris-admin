import { CustomersService } from './customers.service';
declare class CreateCustomerDto {
    firstName: string;
    lastName: string;
    phone: string;
    email?: string;
}
export declare class CustomersController {
    private readonly customersService;
    constructor(customersService: CustomersService);
    list(): import(".prisma/client").Prisma.PrismaPromise<{
        appointments: {
            startsAt: Date;
            status: import(".prisma/client").$Enums.AppointmentStatus;
        }[];
        id: string;
        createdAt: Date;
        _count: {
            appointments: number;
            memberships: number;
        };
        firstName: string;
        lastName: string;
        email: string | null;
        phone: string;
        memberships: {
            status: import(".prisma/client").$Enums.MembershipStatus;
            id: string;
            package: {
                name: string;
            };
        }[];
    }[]>;
    create(body: CreateCustomerDto): import(".prisma/client").Prisma.Prisma__CustomerClient<{
        id: string;
        createdAt: Date;
        firstName: string;
        lastName: string;
        email: string | null;
        phone: string;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, import(".prisma/client").Prisma.PrismaClientOptions>;
}
export {};
