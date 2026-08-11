import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useVaani } from "@/contexts/VaaniContext";

export const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated } = useVaani();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};
