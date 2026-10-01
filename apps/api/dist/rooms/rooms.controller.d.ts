import { RoomsService } from './rooms.service';
declare class CreateRoomDto {
    name: string;
    locationSlug: string;
    description?: string;
    photoUrl?: string;
}
declare class UpdateRoomDto {
    name?: string;
    locationSlug?: string;
    description?: string | null;
    photoUrl?: string | null;
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
        photoUrl: string | null;
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
        photoUrl: string | null;
        name: string;
        isActive: boolean;
        description: string | null;
    }>;
    update(id: string, body: UpdateRoomDto): Promise<{
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
        photoUrl: string | null;
        name: string;
        isActive: boolean;
        description: string | null;
    }>;
    remove(id: string): Promise<{
        success: boolean;
    }>;
}
export {};
