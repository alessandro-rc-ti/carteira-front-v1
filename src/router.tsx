import type { ReactElement } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Layout } from "@/components/Layout";
import {
  BankListPage,
  BankDetailPage,
  BankFormPage,
  BanksTransactionsPage,
  BanksAccountsPage,
  BanksDashboardPage,
  DashboardPage,
  TransactionUploadPage,
  TransactionManualPage,
  InvestmentListPage,
  InvestmentFormPage,
  InstitutionAliasPage,
  InvestmentPortfolioPage,
  LoginPage,
  TransactionEditPage,
  UnauthorizedPage,
  UsersPage,
} from "@/pages";

import { useAuthStore } from "@/stores/authStore";

function withAuth(element: ReactElement, requiredPermissions?: string[]) {
  return <ProtectedRoute requiredPermissions={requiredPermissions}>{element}</ProtectedRoute>;
}

function DefaultRouteRedirect() {
  const hasPermission = useAuthStore((state) => state.hasPermission);

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
    element: <LoginPage />,
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
        element: <UnauthorizedPage />,
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
        path: "transactions/:id/edit",
        element: withAuth(<TransactionEditPage />, ["transaction.edit"]),
      },
    ],
  },
]);
