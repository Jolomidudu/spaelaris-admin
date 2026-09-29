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
        rooms: {
            id: string;
            name: string;
        }[];
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
            availableRooms: {
                id: string;
                name: string;
            }[];
        }[];
    }>;
    createBooking(data: {
        firstName: string;
        lastName: string;
        phone: string;
        email: string;
        locationSlug: string;
        serviceSlugs: string[];
        therapistProfileId: string;
        startsAt: string;
        endsAt: string;
        notes?: string;
    }): Promise<{
        id: string;
        startsAt: Date;
        endsAt: Date;
        status: import(".prisma/client").$Enums.AppointmentStatus;
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
            unitPriceKobo: number;
        }[];
    }>;
}
