import { AuthService } from './auth.service';
import { AuthenticatedRequest } from './auth.types';
declare class LoginDto {
    email: string;
    password: string;
}
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    login(body: LoginDto): Promise<{
        accessToken: string;
        user: import("./auth.types").AuthenticatedUser;
    }>;
    me(request: AuthenticatedRequest): import("./auth.types").AuthenticatedUser | undefined;
}
export {};
