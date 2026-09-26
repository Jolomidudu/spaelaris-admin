import { PrismaService } from '../database/prisma.service';
export declare class PublicBookingService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    locations(): import(".prisma/client").Prisma.PrismaPromise<{
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
}
