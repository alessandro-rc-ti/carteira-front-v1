export interface AuthResponse {
  token: string;
  tokenType: string;
}

export interface AuthUser {
  userId: string;
  accountId: string;
  accountName: string;
  accountActive: boolean;
  subscriptionPlanCode: string;
  standardUserLimit: number;
  username: string;
  role: "SYSTEM_OWNER" | "ACCOUNT_ADMIN" | "STANDARD" | string;
  permissions: string[];
  standardUserQuota: number;
  delegablePermissions: string[];
}