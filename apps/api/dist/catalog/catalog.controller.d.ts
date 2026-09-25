import { CatalogService } from './catalog.service';
export declare class CatalogController {
    private readonly catalogService;
    constructor(catalogService: CatalogService);
    catalog(): import(".prisma/client").Prisma.PrismaPromise<{
        number: string | null;
        id: string;
        services: {
            id: string;
            photoUrl: string | null;
            name: string;
            slug: string;
            description: string | null;
            durationMinutes: number | null;
            includes: string[];
            details: string | null;
            benefits: string[];
            priceKobo: number;
        }[];
        name: string;
        slug: string;
        description: string | null;
        shortName: string | null;
        imageUrl: string | null;
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
}
