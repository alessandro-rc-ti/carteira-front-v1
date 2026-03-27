import type { ReactElement } from "react";
import { Navigate } from "react-router-dom";

import { useAuthStore } from "@/stores/authStore";
import type { UserRole } from "@/types";

type ProtectedRouteProps = {
  children: ReactElement;
  requiredPermissions?: string[];
  requiredRole?: UserRole;
};

export function ProtectedRoute({
  children,
  requiredPermissions,
  requiredRole,
}: ProtectedRouteProps) {
  const initialized = useAuthStore((state) => state.initialized);
  const loading = useAuthStore((state) => state.loading);
  const user = useAuthStore((state) => state.user);
  const hasPermission = useAuthStore((state) => state.hasPermission);

  if (!initialized || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="text-center space-y-2">
          <div className="mx-auto h-10 w-10 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
          <p className="text-sm text-muted-foreground">Validando sessão...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/unauthorized" replace />;
  }

  if (requiredPermissions && !hasPermission(requiredPermissions)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}
