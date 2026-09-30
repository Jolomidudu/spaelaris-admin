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
        startsAt: Date;
        endsAt: Date;
        status: import(".prisma/client").$Enums.AppointmentStatus;
        id: string;
    }>;
    create(data: {
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
    }): Promise<{
        startsAt: Date;
        endsAt: Date;
        status: import(".prisma/client").$Enums.AppointmentStatus;
        id: string;
    }>;
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
}
