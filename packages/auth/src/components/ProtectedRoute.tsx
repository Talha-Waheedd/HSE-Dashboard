import React, { type ReactNode } from "react";
import { useAuthStore } from "../store/authStore";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRoles?: string[];
  fallback?: ReactNode; // e.g. Redirect component to login page
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRoles = [],
  fallback = null,
}) => {
  const { isAuthenticated, hasRole } = useAuthStore();

  if (!isAuthenticated) {
    return <>{fallback}</>;
  }

  if (requiredRoles.length > 0) {
    const hasRequiredRole = requiredRoles.some((role) => hasRole(role))
      || hasRole("Administrator");
    if (!hasRequiredRole) {
      return <div>Access Denied: Insufficient Permissions</div>;
    }
  }

  return <>{children}</>;
};
