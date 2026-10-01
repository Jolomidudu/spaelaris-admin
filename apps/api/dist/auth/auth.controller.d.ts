import { AuthService } from './auth.service';
import { AuthenticatedRequest } from './auth.types';
declare class LoginDto {
    email: string;
    password: string;
}
declare class UpdateProfileDto {
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
}
declare class ChangePasswordDto {
    currentPassword: string;
    newPassword: string;
}
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    login(body: LoginDto): Promise<{
        accessToken: string;
        user: import("./auth.types").AuthenticatedUser;
    }>;
    me(request: AuthenticatedRequest): Promise<{
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
    updateProfile(request: AuthenticatedRequest, body: UpdateProfileDto): Promise<{
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
    changePassword(request: AuthenticatedRequest, body: ChangePasswordDto): Promise<{
        success: boolean;
    }>;
}
export {};
