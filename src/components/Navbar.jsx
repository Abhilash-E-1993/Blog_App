// src/components/Navbar.jsx
import { Link, NavLink } from "react-router-dom";

function Navbar() {
  return (
    <nav className="bg-slate-950 border-b border-slate-800">
      <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Left: App name */}
        <Link to="/" className="text-xl font-bold text-white">
          Blog App 
        </Link>

        {/* Right: Links */}
        <div className="flex items-center gap-4 text-sm">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `hover:text-sky-400 ${isActive ? "text-sky-400" : "text-slate-200"}`
            }
          >
            Home
          </NavLink>

          <NavLink
            to="/create"
            className={({ isActive }) =>
              `hover:text-sky-400 ${isActive ? "text-sky-400" : "text-slate-200"}`
            }
          >
            Create
          </NavLink>

          <NavLink
            to="/profile"
            className={({ isActive }) =>
              `hover:text-sky-400 ${isActive ? "text-sky-400" : "text-slate-200"}`
            }
          >
            Profile
          </NavLink>

          <NavLink
            to="/login"
            className={({ isActive }) =>
              `hover:text-sky-400 ${isActive ? "text-sky-400" : "text-slate-200"}`
            }
          >
            Login
          </NavLink>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
