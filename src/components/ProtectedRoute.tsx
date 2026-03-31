import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { usePlano } from "@/hooks/usePlano";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const { trialExpirado } = usePlano();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (trialExpirado) return <Navigate to="/trial-expirado" replace />;

  return <>{children}</>;
}
