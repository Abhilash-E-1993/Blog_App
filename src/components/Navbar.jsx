// src/components/Navbar.jsx
import {
  Home,
  PenSquare,
  UserCircle,
  LogOut,
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { currentUser, profile, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path) => location.pathname === path;

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  return (
    <>
      {/* Tricolor strip */}
      <div className="relative h-1 w-full overflow-hidden">
        <div
          className="absolute inset-0 bg-gradient-to-r from-orange-500 via-white to-green-500 animate-pulse"
          style={{ animationDuration: "3s" }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-orange-400/50 via-white/50 to-green-400/50 blur-sm" />
      </div>

      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-2xl border-b border-slate-800/50 shadow-xl">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            {/* Left: BharatBlog brand */}
            <button
              type="button"
              onClick={() => navigate("/feed")}
              className="flex items-center gap-3 group"
            >
              {/* Clean tricolor chip (no complex icon) */}
              <div className="relative h-9 w-9 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-orange-500/30 via-white/10 to-green-500/30 blur-md group-hover:blur-lg transition-all duration-500" />
                <div className="relative h-full w-full rounded-full bg-slate-950 border border-slate-700 flex items-center justify-center shadow-md">
                  <div className="h-6 w-6 rounded-full bg-gradient-to-r from-orange-500 via-white to-green-500" />
                </div>
              </div>

              <div className="flex flex-col items-start">
                <span className="text-xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-yellow-300 to-green-400 group-hover:scale-105 transition-transform">
                  BharatBlog
                </span>
                <span className="text-[9px] text-slate-500 tracking-wider uppercase">
                  Made in India
                </span>
              </div>
            </button>

            {/* Right: navigation + profile */}
            <div className="flex items-center gap-2">
              {currentUser ? (
                <>
                  {/* Feed */}
                  <Link
                    to="/feed"
                    className={`
                      group relative px-4 py-2 rounded-xl font-semibold text-sm transition-all duration-300
                      ${
                        isActive("/feed")
                          ? "text-orange-400 bg-orange-500/10 border border-orange-500/30 shadow-lg shadow-orange-500/20"
                          : "text-slate-300 hover:text-slate-100 hover:bg-slate-800/50 border border-transparent"
                      }
                    `}
                  >
                    <span className="flex items-center gap-2">
                      <Home
                        className={`h-4 w-4 ${
                          isActive("/feed")
                            ? "animate-pulse"
                            : "group-hover:scale-110 transition-transform"
                        }`}
                      />
                      <span className="hidden sm:inline">Feed</span>
                    </span>
                    {isActive("/feed") && (
                      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-0.5 w-6 bg-gradient-to-r from-orange-500 to-green-500 rounded-full" />
                    )}
                  </Link>

                  {/* Create */}
                  <Link
                    to="/create"
                    className={`
                      group relative px-4 py-2 rounded-xl font-semibold text-sm transition-all duration-300
                      ${
                        isActive("/create")
                          ? "text-green-400 bg-green-500/10 border border-green-500/30 shadow-lg shadow-green-500/20"
                          : "text-slate-300 hover:text-slate-100 hover:bg-slate-800/50 border border-transparent"
                      }
                    `}
                  >
                    <span className="flex items-center gap-2">
                      <PenSquare
                        className={`h-4 w-4 ${
                          isActive("/create")
                            ? "animate-pulse"
                            : "group-hover:scale-110 transition-transform"
                        }`}
                      />
                      <span className="hidden sm:inline">Create</span>
                    </span>
                    {isActive("/create") && (
                      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-0.5 w-6 bg-gradient-to-r from-orange-500 to-green-500 rounded-full" />
                    )}
                  </Link>

                  {/* Profile */}
                  <Link
                    to="/profile"
                    className={`
                      group relative px-4 py-2 rounded-xl font-semibold text-sm transition-all duration-300
                      ${
                        isActive("/profile")
                          ? "text-sky-400 bg-sky-500/10 border border-sky-500/30 shadow-lg shadow-sky-500/20"
                          : "text-slate-300 hover:text-slate-100 hover:bg-slate-800/50 border border-transparent"
                      }
                    `}
                  >
                    <span className="flex items-center gap-2">
                      <UserCircle
                        className={`h-4 w-4 ${
                          isActive("/profile")
                            ? "animate-pulse"
                            : "group-hover:scale-110 transition-transform"
                        }`}
                      />
                      <span className="hidden sm:inline">Profile</span>
                    </span>
                    {isActive("/profile") && (
                      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-0.5 w-6 bg-gradient-to-r from-orange-500 to-green-500 rounded-full" />
                    )}
                  </Link>

                  {/* Divider */}
                  <div className="hidden sm:block h-8 w-px bg-slate-700/50 mx-2" />

                  {/* User profile chip */}
                  {profile && (
                    <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800/60 border border-slate-700/50 hover:bg-slate-800 transition-colors">
                      <div className="relative h-8 w-8 rounded-full overflow-hidden border-2 border-orange-500/30 bg-slate-800 group">
                        {profile.avatarUrl && (
                          <img
                            src={profile.avatarUrl}
                            alt={profile.name}
                            className="h-full w-full object-cover"
                          />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-tr from-orange-500/20 to-green-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <span className="text-sm font-medium text-slate-200 max-w-[100px] truncate hidden lg:inline">
                        {profile.name}
                      </span>
                    </div>
                  )}

                  {/* Logout */}
                  <button
                    onClick={handleLogout}
                    className="group relative px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 hover:border-slate-600 hover:text-slate-100 font-medium text-sm transition-all duration-300 overflow-hidden"
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      <LogOut className="h-4 w-4 group-hover:scale-110 transition-transform" />
                      <span className="hidden sm:inline">Logout</span>
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-red-600/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                </>
              ) : (
                <>
                  {/* Login */}
                  <Link
                    to="/login"
                    className="px-4 py-2 rounded-xl text-slate-300 hover:text-slate-100 font-medium text-sm transition-colors"
                  >
                    Login
                  </Link>

                  {/* Register */}
                  <Link
                    to="/register"
                    className="group relative px-5 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold text-sm shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 hover:scale-105 transition-all duration-300 overflow-hidden"
                  >
                    <span className="relative z-10">Sign Up</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </Link>
                </>
              )}
            </div>
          </div>
        </nav>
      </header>
    </>
  );
}
