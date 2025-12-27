// src/pages/LandingPage.jsx
import { Link } from "react-router-dom";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="max-w-5xl mx-auto px-4 py-10 flex flex-col lg:flex-row items-center gap-10">
        {/* Left: hero text */}
        <div className="flex-1">
          <p className="text-sm font-medium text-emerald-400 mb-3">
            Welcome to BharatBlog
          </p>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
            Share your thoughts with <span className="text-emerald-400">India</span>.
          </h1>
          <p className="text-slate-300 mb-6 max-w-xl">
            A clean, distraction-free place to post ideas, stories and updates.
            Log in to see your personalized feed and create posts.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/login"
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-md bg-emerald-500 text-white font-medium hover:bg-emerald-600"
            >
              Log in
            </Link>
            <Link
              to="/register"
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-md border border-slate-600 text-slate-100 font-medium hover:border-emerald-500"
            >
              Sign up
            </Link>
          </div>
        </div>

        {/* Right: simple preview card */}
        <div className="flex-1 w-full">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl">
            <p className="text-sm text-slate-300 mb-3">
              Recent posts (sample preview)
            </p>
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-slate-800 border border-slate-700">
                <p className="text-xs text-slate-400 mb-1">Demo user</p>
                <p className="text-sm font-medium text-slate-100">
                  “Start writing and your feed will appear here.”
                </p>
              </div>
              <div className="p-3 rounded-lg bg-slate-800/60 border border-dashed border-slate-700 text-xs text-slate-400">
                Create an account to see live posts from real users.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
