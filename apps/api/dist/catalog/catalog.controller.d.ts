import { CatalogService } from './catalog.service';
import { PublicBookingService } from './public-booking.service';
declare class CreatePublicBookingDto {
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
}
export declare class CatalogController {
    private readonly catalogService;
    private readonly publicBookingService;
    constructor(catalogService: CatalogService, publicBookingService: PublicBookingService);
    locations(): import(".prisma/client").Prisma.PrismaPromise<{
        id: string;
        name: string;
        slug: string;
        address: string;
        city: string;
        timezone: string;
    }[]>;
    catalog(): import(".prisma/client").Prisma.PrismaPromise<{
        number: string | null;
        id: string;
        name: string;
        slug: string;
        description: string | null;
        shortName: string | null;
        imageUrl: string | null;
        services: {
            id: string;
            name: string;
            slug: string;
            description: string | null;
            details: string | null;
            benefits: string[];
            includes: string[];
            durationMinutes: number | null;
            priceKobo: number;
            photoUrl: string | null;
        }[];
    }[]>;
    therapists(): Promise<{
        publicSlug: string;
        displayTitle: string | null;
        name: string;
        role: string;
        city: string;
        location: {
            name: string;
            slug: string;
            city: string;
        };
        services: {
            id: string;
            name: string;
            slug: string;
            durationMinutes: number | null;
            priceKobo: number;
        }[];
        id: string;
        photoUrl: string | null;
        bio: string | null;
        rating: number | null;
        reviewCount: number | null;
        completedAppointments: number | null;
        clientsServed: number | null;
        languages: string[];
    }[]>;
    availability(locationSlug: string, date: string, serviceSlugs: string): Promise<{
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
    createBooking(body: CreatePublicBookingDto): Promise<{
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
export {};
