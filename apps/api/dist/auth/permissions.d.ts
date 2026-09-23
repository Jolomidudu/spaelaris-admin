import { UserRole } from '@prisma/client';
export declare enum Permission {
    ManageUsers = "manage:users",
    ManageLocations = "manage:locations",
    ManageRooms = "manage:rooms",
    ManageServices = "manage:services",
    ManageCustomers = "manage:customers",
    ManageAppointments = "manage:appointments",
    ManagePayments = "manage:payments",
    ManageMemberships = "manage:memberships",
    ManagePackages = "manage:packages",
    ViewReports = "view:reports",
    ManageOwnSchedule = "manage:own-schedule",
    UpdateAssignedAppointments = "update:assigned-appointments"
}
export declare function hasPermission(role: UserRole, permission: Permission): boolean;
export declare function getPermissionsForRole(role: UserRole): Permission[];
