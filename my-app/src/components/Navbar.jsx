// src/components/Navbar.jsx
import {
  Home,
  PenSquare,
  UserCircle,
  LogOut,
  Search,
  MessageCircle,
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useChatUnread } from "../context/ChatUnreadContext";

export default function Navbar() {
  const { currentUser, profile, logout } = useAuth();
  const { unreadCount } = useChatUnread();
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
        <div className="absolute inset-0 bg-gradient-to-r from-orange-400/40 via-white/40 to-green-400/40 blur-sm" />
      </div>

      <header className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur-2xl border-b border-slate-800/70 shadow-[0_18px_40px_rgba(0,0,0,0.9)]">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            {/* Left: brand */}
            <button
              type="button"
              onClick={() => navigate("/feed")}
              className="flex items-center gap-3 group"
            >
              <div className="relative h-9 w-9 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-orange-500/40 via-white/15 to-green-500/40 blur-md group-hover:blur-lg transition-all duration-500" />
                <div className="relative h-full w-full rounded-full bg-slate-950 border border-slate-700 flex items-center justify-center shadow-md shadow-black/60 overflow-hidden">
                  {/* Use same favicon icon as tab */}
                  <img
                    src="/favicon-32x32.png"
                    alt="BharatBlog logo"
                    className="h-6 w-6 rounded-lg"
                  />
                </div>
              </div>

              <div className="flex flex-col items-start">
                <span className="text-xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-yellow-300 to-emerald-300 group-hover:scale-105 transition-transform">
                  BharatBlog
                </span>
                <span className="text-[9px] text-slate-500 tracking-wider uppercase">
                  Made in India
                </span>
              </div>
            </button>

            {/* Right */}
            <div className="flex items-center gap-2">
              {currentUser ? (
                <>
                  {/* Feed */}
                  <Link
                    to="/feed"
                    className={`group relative px-4 py-2 rounded-xl font-semibold text-sm transition-all duration-300 ${
                      isActive("/feed")
                        ? "text-orange-300 bg-slate-900/80 border border-orange-500/60 shadow-[0_0_25px_rgba(249,115,22,0.5)]"
                        : "text-slate-300 hover:text-slate-100 hover:bg-slate-900/70 border border-transparent"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Home
                        className={`h-4 w-4 ${
                          isActive("/feed")
                            ? "text-orange-300"
                            : "group-hover:text-orange-300"
                        }`}
                      />
                      <span className="hidden sm:inline">Feed</span>
                    </span>
                    {isActive("/feed") && (
                      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-0.5 w-7 bg-gradient-to-r from-orange-500 via-yellow-300 to-emerald-400 rounded-full" />
                    )}
                  </Link>

                  {/* Create */}
                  <Link
                    to="/create"
                    className={`group relative px-4 py-2 rounded-xl font-semibold text-sm transition-all duration-300 ${
                      isActive("/create")
                        ? "text-emerald-300 bg-slate-900/80 border border-emerald-500/60 shadow-[0_0_25px_rgba(16,185,129,0.5)]"
                        : "text-slate-300 hover:text-slate-100 hover:bg-slate-900/70 border border-transparent"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <PenSquare
                        className={`h-4 w-4 ${
                          isActive("/create")
                            ? "text-emerald-300"
                            : "group-hover:text-emerald-300"
                        }`}
                      />
                      <span className="hidden sm:inline">Create</span>
                    </span>
                    {isActive("/create") && (
                      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-0.5 w-7 bg-gradient-to-r from-orange-500 via-yellow-300 to-emerald-400 rounded-full" />
                    )}
                  </Link>

                  {/* Search */}
                  <Link
                    to="/search"
                    className={`group relative px-4 py-2 rounded-xl font-semibold text-sm transition-all duration-300 ${
                      isActive("/search")
                        ? "text-sky-300 bg-slate-900/80 border border-sky-500/60 shadow-[0_0_25px_rgba(56,189,248,0.5)]"
                        : "text-slate-300 hover:text-slate-100 hover:bg-slate-900/70 border border-transparent"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Search
                        className={`h-4 w-4 ${
                          isActive("/search")
                            ? "text-sky-300"
                            : "group-hover:text-sky-300"
                        }`}
                      />
                      <span className="hidden sm:inline">Search</span>
                    </span>
                    {isActive("/search") && (
                      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-0.5 w-7 bg-gradient-to-r from-orange-500 via-yellow-300 to-emerald-400 rounded-full" />
                    )}
                  </Link>

                  {/* Chats with unread badge */}
                  <Link
                    to="/chats"
                    className={`group relative px-4 py-2 rounded-xl font-semibold text-sm transition-all duration-300 ${
                      isActive("/chats")
                        ? "text-emerald-300 bg-slate-900/80 border border-emerald-500/60 shadow-[0_0_25px_rgba(16,185,129,0.5)]"
                        : "text-slate-300 hover:text-slate-100 hover:bg-slate-900/70 border border-transparent"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <div className="relative">
                        <MessageCircle
                          className={`h-4 w-4 ${
                            isActive("/chats")
                              ? "text-emerald-300"
                              : "group-hover:text-emerald-300"
                          }`}
                        />
                        {unreadCount > 0 && (
                          <span className="absolute -top-1 -right-1 min-h-[14px] min-w-[14px] px-1 rounded-full bg-red-500 text-[9px] leading-[14px] text-white flex items-center justify-center shadow-[0_0_10px_rgba(248,113,113,0.8)]">
                            {unreadCount > 9 ? "9+" : unreadCount}
                          </span>
                        )}
                      </div>
                      <span className="hidden sm:inline">Chats</span>
                    </span>
                    {isActive("/chats") && (
                      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-0.5 w-7 bg-gradient-to-r from-orange-500 via-yellow-300 to-emerald-400 rounded-full" />
                    )}
                  </Link>

                  {/* Profile */}
                  <Link
                    to="/profile"
                    className={`group relative px-4 py-2 rounded-xl font-semibold text-sm transition-all duration-300 ${
                      isActive("/profile")
                        ? "text-indigo-300 bg-slate-900/80 border border-indigo-500/60 shadow-[0_0_25px_rgba(129,140,248,0.5)]"
                        : "text-slate-300 hover:text-slate-100 hover:bg-slate-900/70 border border-transparent"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <UserCircle
                        className={`h-4 w-4 ${
                          isActive("/profile")
                            ? "text-indigo-300"
                            : "group-hover:text-indigo-300"
                        }`}
                      />
                      <span className="hidden sm:inline">Profile</span>
                    </span>
                    {isActive("/profile") && (
                      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-0.5 w-7 bg-gradient-to-r from-orange-500 via-yellow-300 to-emerald-400 rounded-full" />
                    )}
                  </Link>

                  {/* Divider */}
                  <div className="hidden sm:block h-8 w-px bg-slate-700/60 mx-2" />

                  {/* User chip */}
                  {profile && (
                    <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-2xl bg-slate-900/80 border border-slate-700/60 hover:bg-slate-900 transition-colors">
                      <div className="relative h-8 w-8 rounded-full overflow-hidden border-2 border-orange-500/40 bg-slate-800 group">
                        {profile.avatarUrl && (
                          <img
                            src={profile.avatarUrl}
                            alt={profile.name}
                            className="h-full w-full object-cover"
                          />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-tr from-orange-500/25 to-emerald-500/25 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <span className="text-sm font-medium text-slate-200 max-w-[110px] truncate hidden lg:inline">
                        {profile.name}
                      </span>
                    </div>
                  )}

                  {/* Logout */}
                  <button
                    onClick={handleLogout}
                    className="group relative px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 hover:bg-red-900/40 hover:border-red-500/70 hover:text-red-100 font-medium text-sm transition-all duration-300 overflow-hidden"
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      <LogOut className="h-4 w-4 group-hover:text-red-300" />
                      <span className="hidden sm:inline">Logout</span>
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 to-red-600/25 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="px-4 py-2 rounded-xl text-slate-300 hover:text-slate-100 font-medium text-sm transition-colors"
                  >
                    Login
                  </Link>

                  <Link
                    to="/register"
                    className="group relative px-5 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold text-sm shadow-lg shadow-orange-500/40 hover:shadow-orange-500/60 hover:scale-105 transition-all duration-300 overflow-hidden"
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
