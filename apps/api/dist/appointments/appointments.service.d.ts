import { AppointmentStatus } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
export declare class AppointmentsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    update(id: string, data: {
        startsAt?: string;
        endsAt?: string;
        status?: AppointmentStatus;
        notes?: string;
    }): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.AppointmentStatus;
        startsAt: Date;
        endsAt: Date;
    }>;
    create(data: {
        customerPhone: string;
        serviceSlug: string;
        locationSlug: string;
        therapistEmail?: string;
        roomName?: string;
        startsAt: string;
        endsAt: string;
        status?: AppointmentStatus;
        notes?: string;
    }): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.AppointmentStatus;
        startsAt: Date;
        endsAt: Date;
    }>;
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
}
