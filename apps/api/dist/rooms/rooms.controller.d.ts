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
        location: {
            id: string;
            name: string;
            slug: string;
            city: string;
        };
        _count: {
            appointments: number;
        };
        name: string;
        isActive: boolean;
        description: string | null;
    }[]>;
    create(body: CreateRoomDto): Promise<{
        id: string;
        location: {
            id: string;
            name: string;
            slug: string;
            city: string;
        };
        _count: {
            appointments: number;
        };
        name: string;
        isActive: boolean;
        description: string | null;
    }>;
}
export {};
