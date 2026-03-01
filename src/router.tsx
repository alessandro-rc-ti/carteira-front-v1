import { createBrowserRouter, Navigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { BankListPage, BankDetailPage, BankFormPage } from "@/pages";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      {
        index: true,
        element: <Navigate to="/banks" replace />,
      },
      {
        path: "banks",
        element: <BankListPage />,
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
    ],
  },
]);
