import { AppointmentStatus } from '@prisma/client';
import { AppointmentsService } from './appointments.service';
declare class CreateAppointmentDto {
    customerPhone: string;
    serviceSlug: string;
    locationSlug: string;
    therapistEmail?: string;
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
        id: string;
        status: import(".prisma/client").$Enums.AppointmentStatus;
        startsAt: Date;
        endsAt: Date;
        notes: string | null;
        customer: {
            firstName: string;
            lastName: string;
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
    create(body: CreateAppointmentDto): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.AppointmentStatus;
        startsAt: Date;
        endsAt: Date;
    }>;
    update(id: string, body: UpdateAppointmentDto): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.AppointmentStatus;
        startsAt: Date;
        endsAt: Date;
    }>;
}
export {};
