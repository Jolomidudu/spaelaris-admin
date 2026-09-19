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
        location: {
            name: string;
            city: string;
        };
        room: {
            name: string;
        } | null;
        customer: {
            firstName: string;
            lastName: string;
            phone: string;
        };
        id: string;
        status: import(".prisma/client").$Enums.AppointmentStatus;
        services: {
            name: string;
            durationMinutes: number;
            quantity: number;
        }[];
        notes: string | null;
        startsAt: Date;
        endsAt: Date;
        therapist: {
            firstName: string;
            lastName: string;
        } | null;
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
