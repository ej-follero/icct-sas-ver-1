export const permissions = {
  admin:   { canCreate: true,  canEdit: true,  canDelete: true,  canBulk: true },
  staff:   { canCreate: true,  canEdit: true,  canDelete: true,  canBulk: true },
  viewer:  { canCreate: false, canEdit: false, canDelete: false, canBulk: false },
};

export type UserRole = keyof typeof permissions;
export type PermissionAction = keyof typeof permissions.admin;

export function canPerform(role: UserRole, action: PermissionAction): boolean {
  return !!permissions[role][action];
} 