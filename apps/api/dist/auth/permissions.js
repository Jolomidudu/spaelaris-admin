"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Permission = void 0;
exports.hasPermission = hasPermission;
exports.getPermissionsForRole = getPermissionsForRole;
const client_1 = require("@prisma/client");
var Permission;
(function (Permission) {
    Permission["ManageUsers"] = "manage:users";
    Permission["ManageLocations"] = "manage:locations";
    Permission["ManageRooms"] = "manage:rooms";
    Permission["ManageServices"] = "manage:services";
    Permission["ManageCustomers"] = "manage:customers";
    Permission["ManageAppointments"] = "manage:appointments";
    Permission["ManagePayments"] = "manage:payments";
    Permission["ManageMemberships"] = "manage:memberships";
    Permission["ManagePackages"] = "manage:packages";
    Permission["ViewReports"] = "view:reports";
    Permission["ManageOwnSchedule"] = "manage:own-schedule";
    Permission["UpdateAssignedAppointments"] = "update:assigned-appointments";
})(Permission || (exports.Permission = Permission = {}));
const rolePermissions = {
    [client_1.UserRole.OWNER]: new Set(Object.values(Permission)),
    [client_1.UserRole.MANAGER]: new Set([
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
    [client_1.UserRole.RECEPTIONIST]: new Set([
        Permission.ManageCustomers,
        Permission.ManageAppointments,
        Permission.ManagePayments,
        Permission.ManageMemberships,
    ]),
    [client_1.UserRole.THERAPIST]: new Set([
        Permission.ManageOwnSchedule,
        Permission.UpdateAssignedAppointments,
    ]),
};
function hasPermission(role, permission) {
    return rolePermissions[role].has(permission);
}
function getPermissionsForRole(role) {
    return [...rolePermissions[role]];
}
//# sourceMappingURL=permissions.js.map