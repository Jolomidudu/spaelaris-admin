import { AppointmentStatus } from '@prisma/client';
import { AppointmentsService } from './appointments.service';
declare class CreateAppointmentDto {
    customerPhone: string;
    customerFirstName: string;
    customerLastName: string;
    customerNote?: string;
    serviceSlug: string;
    locationSlug: string;
    therapistEmail?: string;
    therapistProfileId?: string;
    roomName?: string;
    startsAt: string;
    endsAt: string;
    status?: AppointmentStatus;
    notes?: string;
}
declare class UpdateAppointmentDto {
    startsAt?: string;
    endsAt?: string;
    status?: AppointmentStatus;
    notes?: string;
}
export declare class AppointmentsController {
    private readonly appointmentsService;
    constructor(appointmentsService: AppointmentsService);
    list(): import(".prisma/client").Prisma.PrismaPromise<{
        startsAt: Date;
        endsAt: Date;
        status: import(".prisma/client").$Enums.AppointmentStatus;
        notes: string | null;
        id: string;
        customer: {
            firstName: string;
            lastName: string;
            email: string | null;
            phone: string;
        };
        location: {
            name: string;
            city: string;
        };
        therapist: {
            firstName: string;
            lastName: string;
        } | null;
        room: {
            name: string;
        } | null;
        services: {
            name: string;
            durationMinutes: number;
            quantity: number;
        }[];
    }[]>;
    options(): Promise<{
        locations: {
            id: string;
            name: string;
            slug: string;
        }[];
        categories: {
            id: string;
            name: string;
            slug: string;
        }[];
        services: {
            id: string;
            name: string;
            slug: string;
            durationMinutes: number | null;
            priceKobo: number;
            category: {
                id: string;
                name: string;
                slug: string;
            };
        }[];
        therapists: {
            staffProfileId: string;
            locationSlug: string;
            serviceSlugs: string[];
            id: string;
            firstName: string;
            lastName: string;
            email: string;
        }[];
        rooms: {
            locationSlug: string;
            id: string;
            name: string;
        }[];
    }>;
    create(body: CreateAppointmentDto): Promise<{
        startsAt: Date;
        endsAt: Date;
        status: import(".prisma/client").$Enums.AppointmentStatus;
        id: string;
    }>;
    update(id: string, body: UpdateAppointmentDto): Promise<{
        startsAt: Date;
        endsAt: Date;
        status: import(".prisma/client").$Enums.AppointmentStatus;
        id: string;
    }>;
}
export {};
