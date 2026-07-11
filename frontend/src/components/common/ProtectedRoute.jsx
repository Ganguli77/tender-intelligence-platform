import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../context/useAuth";

export default function ProtectedRoute({ adminOnly = false, role }) {
  const { isAuthenticated, isAdmin, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  const requiresAdmin = adminOnly || String(role || "").toUpperCase() === "ADMIN";

  if (requiresAdmin && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  if (role && String(role).toUpperCase() !== "ADMIN" && user?.role !== String(role).toUpperCase()) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
