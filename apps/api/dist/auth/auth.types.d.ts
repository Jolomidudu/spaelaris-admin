import { UserRole } from '@prisma/client';
export type AuthenticatedUser = {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
};
export type AuthenticatedRequest = Request & {
    user?: AuthenticatedUser;
};
