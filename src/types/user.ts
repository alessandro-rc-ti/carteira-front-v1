export type UserRole = "OWNER" | "ADMIN" | "STANDARD";

export interface AppUser {
  id: string;
  accountId: string;
  username: string;
  email: string | null;
  role: UserRole;
  permissions: string[];
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
  active?: boolean;
}

export interface AppUserUpdateRequest {
  username: string;
  email?: string | null;
  role: UserRole;
  permissions: string[];
  active: boolean;
}

export interface AppUserManagementMetadata {
  assignableRoles: UserRole[];
  availablePermissions: string[];
}