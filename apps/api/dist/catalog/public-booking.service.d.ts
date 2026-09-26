import { Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
export declare class PublicBookingService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    locations(): Prisma.PrismaPromise<{
        id: string;
        name: string;
        slug: string;
        address: string;
        city: string;
        timezone: string;
    }[]>;
    availability(locationSlug: string, date: string, serviceSlugs: string[]): Promise<{
        date: string;
        locationSlug: string;
        totalDurationMinutes: number;
        slotIntervalMinutes: number;
        slots: {
            startsAt: string;
            endsAt: string;
            therapistId: string;
            therapistName: string;
            availableRoomCount: number;
        }[];
    }>;
    createBooking(data: {
        firstName: string;
        lastName: string;
        phone: string;
        email?: string;
        locationSlug: string;
        serviceSlugs: string[];
        therapistProfileId: string;
        startsAt: string;
        endsAt: string;
        notes?: string;
    }): Promise<{
        startsAt: Date;
        endsAt: Date;
        location: {
            name: string;
            city: string;
        };
        id: string;
        services: {
            name: string;
            durationMinutes: number;
            unitPriceKobo: number;
        }[];
        status: import(".prisma/client").$Enums.AppointmentStatus;
        room: {
            name: string;
        } | null;
        therapist: {
            firstName: string;
            lastName: string;
        } | null;
    }>;
}
