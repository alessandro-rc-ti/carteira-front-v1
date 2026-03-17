export interface AuthResponse {
  token: string;
  tokenType: string;
}

export interface AuthUser {
  userId: string;
  accountId: string;
  username: string;
  role: "OWNER" | "ADMIN" | "STANDARD" | string;
  permissions: string[];
}