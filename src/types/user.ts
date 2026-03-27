export type UserRole = "SYSTEM_OWNER" | "ACCOUNT_ADMIN" | "STANDARD";

export interface AppUser {
  id: string;
  accountId: string;
  username: string;
  email: string | null;
  role: UserRole;
  permissions: string[];
  standardUserQuota: number;
  delegablePermissions: string[];
  managedByUserId: string | null;
  managedByUsername: string | null;
  active: boolean;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface AppUserCreateRequest {
  username: string;
  email?: string | null;
  password: string;
  role: UserRole;
  permissions: string[];
  standardUserQuota: number;
  delegablePermissions: string[];
  active?: boolean;
}

export interface AppUserUpdateRequest {
  username: string;
  email?: string | null;
  role: UserRole;
  permissions: string[];
  standardUserQuota: number;
  delegablePermissions: string[];
  active: boolean;
}

export interface AppUserManagementMetadata {
  assignableRoles: UserRole[];
  availablePermissions: string[];
  availableDelegablePermissions: string[];
  managedStandardUserQuota: number;
  managedStandardUsersUsed: number;
  accountAdminUsersCount: number;
}