// src/components/Navbar.jsx
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { currentUser, profile, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path) =>
    location.pathname === path
      ? "text-emerald-400"
      : "text-slate-200 hover:text-white";

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  return (
    <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur">
      <nav className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="text-lg font-semibold text-white">
          Blog App
        </Link>

        <div className="flex items-center gap-4 text-sm">
          {currentUser && (
            <>
              <Link to="/" className={isActive("/")}>
                Home
              </Link>
              <Link to="/create" className={isActive("/create")}>
                Create
              </Link>
              <Link to="/profile" className={isActive("/profile")}>
                Profile
              </Link>
            </>
          )}

          {!currentUser && (
            <>
              <Link to="/login" className={isActive("/login")}>
                Login
              </Link>
              <Link to="/register" className={isActive("/register")}>
                Register
              </Link>
            </>
          )}

          {currentUser && profile && (
            <>
              <div className="flex items-center gap-2">
                {profile.avatarUrl && (
                  <div className="h-8 w-8 rounded-full overflow-hidden border border-slate-600 bg-slate-800">
                    <img
                      src={profile.avatarUrl}
                      alt={profile.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}
                <span className="text-xs text-slate-200 hidden sm:inline">
                  {profile.name}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="px-3 py-1 rounded-md bg-slate-800 text-slate-100 hover:bg-slate-700 text-xs font-medium"
              >
                Logout
              </button>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
