import { Permission } from './permissions';
export declare const REQUIRED_PERMISSIONS_KEY = "requiredPermissions";
export declare const RequirePermissions: (...permissions: Permission[]) => import("@nestjs/common").CustomDecorator<string>;
