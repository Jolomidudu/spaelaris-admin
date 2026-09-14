import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';
import {
  hasPermission,
  Permission,
} from './permissions';
import { REQUIRED_PERMISSIONS_KEY } from './require-permissions.decorator';

type AuthenticatedRequest = {
  user?: {
    role?: UserRole;
  };
};

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(
      REQUIRED_PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions?.length) {
      return true;
    }

    const request = context
      .switchToHttp()
      .getRequest<AuthenticatedRequest>();
    const role = request.user?.role;

    if (
      !role ||
      !requiredPermissions.every((permission) =>
        hasPermission(role, permission),
      )
    ) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }
}
