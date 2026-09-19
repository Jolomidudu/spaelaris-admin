import { RoomsService } from './rooms.service';
declare class CreateRoomDto {
    name: string;
    locationSlug: string;
    description?: string;
}
export declare class RoomsController {
    private readonly roomsService;
    constructor(roomsService: RoomsService);
    list(): import(".prisma/client").Prisma.PrismaPromise<{
        id: string;
        name: string;
        description: string | null;
        isActive: boolean;
        location: {
            id: string;
            name: string;
            slug: string;
            city: string;
        };
        _count: {
            appointments: number;
        };
    }[]>;
    create(body: CreateRoomDto): Promise<{
        id: string;
        name: string;
        description: string | null;
        isActive: boolean;
        location: {
            id: string;
            name: string;
            slug: string;
            city: string;
        };
        _count: {
            appointments: number;
        };
    }>;
}
export {};
