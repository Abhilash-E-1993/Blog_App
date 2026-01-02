// src/routes/ProtectedRoute.jsx
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <p className="text-slate-200">Loading...</p>
      </div>
    );
  }

  if (!currentUser || !currentUser.emailVerified) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
