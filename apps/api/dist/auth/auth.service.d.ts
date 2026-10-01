import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../database/prisma.service';
import { AuthenticatedUser } from './auth.types';
export declare class AuthService {
    private readonly prisma;
    private readonly jwtService;
    constructor(prisma: PrismaService, jwtService: JwtService);
    login(email: string, password: string): Promise<{
        accessToken: string;
        user: AuthenticatedUser;
    }>;
    profile(userId: string): Promise<{
        bio: string | null;
        photoUrl: string | null;
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        phone: string | null;
        country: string | null;
        cityState: string | null;
        postalCode: string | null;
        taxId: string | null;
        facebookUrl: string | null;
        xUrl: string | null;
        linkedinUrl: string | null;
        instagramUrl: string | null;
        role: import(".prisma/client").$Enums.UserRole;
    }>;
    updateProfile(userId: string, data: {
        firstName?: string;
        lastName?: string;
        email?: string;
        phone?: string | null;
        bio?: string | null;
        photoUrl?: string | null;
        country?: string | null;
        cityState?: string | null;
        postalCode?: string | null;
        taxId?: string | null;
        facebookUrl?: string | null;
        xUrl?: string | null;
        linkedinUrl?: string | null;
        instagramUrl?: string | null;
    }): Promise<{
        bio: string | null;
        photoUrl: string | null;
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        phone: string | null;
        country: string | null;
        cityState: string | null;
        postalCode: string | null;
        taxId: string | null;
        facebookUrl: string | null;
        xUrl: string | null;
        linkedinUrl: string | null;
        instagramUrl: string | null;
        role: import(".prisma/client").$Enums.UserRole;
    }>;
    changePassword(userId: string, currentPassword: string, newPassword: string): Promise<{
        success: boolean;
    }>;
}
