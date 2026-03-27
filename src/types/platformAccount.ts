/**
 * Platform Account types for SYSTEM_OWNER management
 */

export interface PlatformAccount {
  id: string;
  name: string;
  active: boolean;
  subscriptionPlanCode: string;
  accountAdminUsersCount: number;
  standardUserLimit: number;
  activeStandardUsers: number;
  createdAt: string;
  updatedAt: string;
}

export interface PlatformAccountProvisionRequest {
  accountName: string;
  accountAdminUsername: string;
  accountAdminEmail: string;
  accountAdminPassword: string;
  subscriptionPlanCode: string;
  standardUserLimit: number;
  accountAdminStandardUserQuota?: number;
  accountAdminDelegablePermissions?: string[];
  active?: boolean;
}

export interface PlatformAccountUpdateRequest {
  name?: string;
  subscriptionPlanCode?: string;
  standardUserLimit?: number;
  active?: boolean;
}

export interface SubscriptionPlan {
  code: string;
  displayName: string;
  defaultStandardUserLimit: number;
  includedModules: string[];
}

/**
 * Planos de assinatura disponíveis
 */
export const SUBSCRIPTION_PLANS: Record<string, SubscriptionPlan> = {
  STARTER: {
    code: "STARTER",
    displayName: "Iniciante",
    defaultStandardUserLimit: 3,
    includedModules: ["dashboard", "bank_basic"],
  },
  PROFESSIONAL: {
    code: "PROFESSIONAL",
    displayName: "Profissional",
    defaultStandardUserLimit: 10,
    includedModules: ["dashboard", "bank_full", "investment_basic"],
  },
  PREMIUM: {
    code: "PREMIUM",
    displayName: "Premium",
    defaultStandardUserLimit: 25,
    includedModules: ["dashboard", "bank_full", "investment_full", "b3_import"],
  },
  ENTERPRISE: {
    code: "ENTERPRISE",
    displayName: "Empresarial",
    defaultStandardUserLimit: Number.MAX_SAFE_INTEGER,
    includedModules: [
      "dashboard",
      "bank_full",
      "investment_full",
      "b3_import",
      "advanced_reports",
    ],
  },
};
