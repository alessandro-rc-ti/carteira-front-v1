/* eslint-disable react-refresh/only-export-components */
import { Suspense, lazy, type ReactElement } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Layout } from "@/components/Layout";

import { useAuthStore } from "@/stores/authStore";
import type { UserRole } from "@/types";

const BankListPage = lazy(async () => ({
  default: (await import("@/pages/BankListPage")).BankListPage,
}));
const BankDetailPage = lazy(async () => ({
  default: (await import("@/pages/BankDetailPage")).BankDetailPage,
}));
const BankFormPage = lazy(async () => ({
  default: (await import("@/pages/BankFormPage")).BankFormPage,
}));
const BanksTransactionsPage = lazy(() => import("@/pages/BanksTransactionsPage"));
const BanksAccountsPage = lazy(() => import("@/pages/BanksAccountsPage"));
const BanksDashboardPage = lazy(async () => ({
  default: (await import("@/pages/BanksDashboardPage")).BanksDashboardPage,
}));
const DashboardPage = lazy(async () => ({
  default: (await import("@/pages/DashboardPage")).DashboardPage,
}));
const TransactionUploadPage = lazy(async () => ({
  default: (await import("@/pages/TransactionUploadPage")).TransactionUploadPage,
}));
const TransactionManualPage = lazy(async () => ({
  default: (await import("@/pages/TransactionManualPage")).TransactionManualPage,
}));
const InvestmentListPage = lazy(async () => ({
  default: (await import("@/pages/InvestmentListPage")).InvestmentListPage,
}));
const InvestmentFormPage = lazy(async () => ({
  default: (await import("@/pages/InvestmentFormPage")).InvestmentFormPage,
}));
const InstitutionAliasPage = lazy(async () => ({
  default: (await import("@/pages/InstitutionAliasPage")).InstitutionAliasPage,
}));
const InvestmentPortfolioPage = lazy(async () => ({
  default: (await import("@/pages/InvestmentPortfolioPage")).InvestmentPortfolioPage,
}));
const LoginPage = lazy(async () => ({
  default: (await import("@/pages/LoginPage")).LoginPage,
}));
const TransactionEditPage = lazy(() => import("@/pages/TransactionEditPage"));
const UnauthorizedPage = lazy(async () => ({
  default: (await import("@/pages/UnauthorizedPage")).UnauthorizedPage,
}));
const UsersPage = lazy(async () => ({
  default: (await import("@/pages/UsersPage")).UsersPage,
}));
const TransactionTypesPage = lazy(async () => ({
  default: (await import("@/pages/TransactionTypesPage")).TransactionTypesPage,
}));
const PlatformAccountsPage = lazy(async () => ({
  default: (await import("@/pages/PlatformAccountsPage")).PlatformAccountsPage,
}));

function withSuspense(element: ReactElement) {
  return (
    <Suspense
      fallback={
        <div className="p-6 text-sm text-muted-foreground">Carregando página...</div>
      }
    >
      {element}
    </Suspense>
  );
}

function withAuth(
  element: ReactElement,
  requiredPermissions?: string[],
  requiredRole?: UserRole
) {
  return (
    <ProtectedRoute requiredPermissions={requiredPermissions} requiredRole={requiredRole}>
      {withSuspense(element)}
    </ProtectedRoute>
  );
}

function DefaultRouteRedirect() {
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const user = useAuthStore((state) => state.user);

  // SYSTEM_OWNER always goes to platform accounts
  if (user?.role === "SYSTEM_OWNER") {
    return <Navigate to="/platform/accounts" replace />;
  }

  const candidates = [
    { path: "/dashboard", permissions: ["dashboard.main.view"] },
    { path: "/banks/dashboard", permissions: ["bank.dashboard.view"] },
    { path: "/banks/accounts", permissions: ["bank.accounts.view", "bank.accounts.manage"] },
    { path: "/banks/transactions", permissions: ["transaction.view"] },
    { path: "/investments/portfolio", permissions: ["investment.portfolio.view"] },
    { path: "/investments/transactions", permissions: ["investment.transactions.view", "investment.transactions.manage"] },
    { path: "/investments/institution-aliases", permissions: ["institution_alias.manage"] },
    { path: "/users", permissions: ["user.manage"] },
  ];

  const firstAllowed = candidates.find((item) => hasPermission(item.permissions));
  return <Navigate to={firstAllowed?.path ?? "/unauthorized"} replace />;
}

export const router = createBrowserRouter([
  {
    path: "/login",
    element: withSuspense(<LoginPage />),
  },
  {
    path: "/",
    element: withAuth(<Layout />),
    children: [
      {
        index: true,
        element: <DefaultRouteRedirect />,
      },
      {
        path: "unauthorized",
        element: withSuspense(<UnauthorizedPage />),
      },
      {
        path: "dashboard",
        element: withAuth(<DashboardPage />, ["dashboard.main.view"]),
      },
      {
        path: "banks/dashboard",
        element: withAuth(<BanksDashboardPage />, ["bank.dashboard.view"]),
      },
      {
        path: "banks",
        element: withAuth(<BankListPage />, ["bank.accounts.view", "bank.accounts.manage"]),
      },
      {
        path: "banks/accounts",
        element: withAuth(<BanksAccountsPage />, ["bank.accounts.view", "bank.accounts.manage"]),
      },
      {
        path: "banks/transactions",
        element: withAuth(<BanksTransactionsPage />, ["transaction.view"]),
      },
      {
        path: "banks/transactions/:id/edit",
        element: withAuth(<TransactionEditPage />, ["transaction.edit"]),
      },
      {
        path: "banks/new",
        element: withAuth(<BankFormPage />, ["bank.accounts.manage"]),
      },
      {
        path: "banks/:id",
        element: withAuth(<BankDetailPage />, ["bank.accounts.view", "bank.accounts.manage"]),
      },
      {
        path: "banks/:id/edit",
        element: withAuth(<BankFormPage />, ["bank.accounts.manage"]),
      },
      {
        path: "transaction-upload/:bankId",
        element: withAuth(<TransactionUploadPage />, ["transaction.import"]),
      },
      {
        path: "transaction-manual/:bankId",
        element: withAuth(<TransactionManualPage />, ["transaction.create"]),
      },
      {
        path: "banks/transactions/import",
        element: withAuth(<TransactionUploadPage />, ["transaction.import"]),
      },
      {
        path: "banks/transactions/new",
        element: withAuth(<TransactionManualPage />, ["transaction.create"]),
      },
      {
        path: "investments/transactions",
        element: withAuth(<InvestmentListPage />, ["investment.transactions.view", "investment.transactions.manage"]),
      },
      {
        path: "investments/portfolio",
        element: withAuth(<InvestmentPortfolioPage />, ["investment.portfolio.view"]),
      },
      {
        path: "investments/transactions/new",
        element: withAuth(<InvestmentFormPage />, ["investment.transactions.manage"]),
      },
      {
        path: "investments/transactions/:id/edit",
        element: withAuth(<InvestmentFormPage />, ["investment.transactions.manage"]),
      },
      {
        path: "investments/institution-aliases",
        element: withAuth(<InstitutionAliasPage />, ["institution_alias.manage"]),
      },
      {
        path: "users",
        element: withAuth(<UsersPage />, ["user.manage"]),
      },
      {
        path: "platform/accounts",
        element: withAuth(<PlatformAccountsPage />, undefined, "SYSTEM_OWNER"),
      },
      {
        path: "transaction-types",
        element: withAuth(<TransactionTypesPage />, ["transaction.types.manage"]),
      },
      {
        path: "transactions/:id/edit",
        element: withAuth(<TransactionEditPage />, ["transaction.edit"]),
      },
    ],
  },
]);
