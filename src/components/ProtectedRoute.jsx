import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { currentUser } = useAuth();

  // No user or email not verified -> send to login
  if (!currentUser || !currentUser.emailVerified) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
