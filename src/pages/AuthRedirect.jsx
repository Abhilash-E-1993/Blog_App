// src/routes/AuthRedirect.jsx
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function AuthRedirect() {
  const { currentUser, loading } = useAuth();

  // AuthProvider already shows a full‑screen loader while loading,
  // so just don't render routes here to avoid flicker.
  if (loading) return null;

  if (currentUser && currentUser.emailVerified) {
    // Already logged in → go straight to feed
    return <Navigate to="/feed" replace />;
  }

  // Not logged in or not verified → show nested public routes
  return <Outlet />;
}
