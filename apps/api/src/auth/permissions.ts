import { UserRole } from '@prisma/client';

export enum Permission {
  ManageUsers = 'manage:users',
  ManageLocations = 'manage:locations',
  ManageRooms = 'manage:rooms',
  ManageServices = 'manage:services',
  ManageCustomers = 'manage:customers',
  ManageAppointments = 'manage:appointments',
  ManagePayments = 'manage:payments',
  ManageMemberships = 'manage:memberships',
  ManagePackages = 'manage:packages',
  ViewReports = 'view:reports',
  ManageOwnSchedule = 'manage:own-schedule',
  UpdateAssignedAppointments = 'update:assigned-appointments',
}

const rolePermissions: Record<UserRole, ReadonlySet<Permission>> = {
  [UserRole.OWNER]: new Set(Object.values(Permission)),
  [UserRole.MANAGER]: new Set([
    Permission.ManageLocations,
    Permission.ManageRooms,
    Permission.ManageServices,
    Permission.ManageCustomers,
    Permission.ManageAppointments,
    Permission.ManagePayments,
    Permission.ManageMemberships,
    Permission.ManagePackages,
    Permission.ViewReports,
    Permission.ManageOwnSchedule,
  ]),
  [UserRole.RECEPTIONIST]: new Set([
    Permission.ManageCustomers,
    Permission.ManageAppointments,
    Permission.ManagePayments,
    Permission.ManageMemberships,
  ]),
  [UserRole.THERAPIST]: new Set([
    Permission.ManageOwnSchedule,
    Permission.UpdateAssignedAppointments,
  ]),
};

export function hasPermission(
  role: UserRole,
  permission: Permission,
): boolean {
  return rolePermissions[role].has(permission);
}

export function getPermissionsForRole(role: UserRole): Permission[] {
  return [...rolePermissions[role]];
}
