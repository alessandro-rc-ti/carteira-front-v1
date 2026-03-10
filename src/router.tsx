import { createBrowserRouter, Navigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import {
  BankListPage,
  BankDetailPage,
  BankFormPage,
  BanksTransactionsPage,
  BanksAccountsPage,
  DashboardPage,
  TransactionUploadPage,
  TransactionManualPage,
  InvestmentListPage,
  InvestmentFormPage,
  InstitutionAliasPage,
  InvestmentPortfolioPage,
} from "@/pages";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: "dashboard",
        element: <DashboardPage />,
      },
      {
        path: "banks",
        element: <BankListPage />,
      },
      {
        path: "banks/accounts",
        element: <BanksAccountsPage />,
      },
      {
        path: "banks/transactions",
        element: <BanksTransactionsPage />,
      },
      {
        path: "banks/new",
        element: <BankFormPage />,
      },
      {
        path: "banks/:id",
        element: <BankDetailPage />,
      },
      {
        path: "banks/:id/edit",
        element: <BankFormPage />,
      },
      {
        path: "transaction-upload/:bankId",
        element: <TransactionUploadPage />,
      },
      {
        path: "transaction-manual/:bankId",
        element: <TransactionManualPage />,
      },
      {
        path: "banks/transactions/import",
        element: <TransactionUploadPage />,
      },
      {
        path: "banks/transactions/new",
        element: <TransactionManualPage />,
      },
      {
        path: "investments/transactions",
        element: <InvestmentListPage />,
      },
      {
        path: "investments/portfolio",
        element: <InvestmentPortfolioPage />,
      },
      {
        path: "investments/transactions/new",
        element: <InvestmentFormPage />,
      },
      {
        path: "investments/transactions/:id/edit",
        element: <InvestmentFormPage />,
      },
      {
        path: "investments/institution-aliases",
        element: <InstitutionAliasPage />,
      },
    ],
  },
]);
