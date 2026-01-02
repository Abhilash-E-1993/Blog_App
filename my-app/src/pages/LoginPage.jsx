// src/pages/LoginPage.jsx
import { useState } from "react";
import { Sparkles, Mail, Lock, ArrowRight } from "lucide-react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { Link, useNavigate } from "react-router-dom";
import { auth } from "../lib/firebase";

export default function LoginPage() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setInfo("");

    if (!form.email || !form.password) {
      setError("Email and password are required.");
      return;
    }

    try {
      setSubmitting(true);
      // Firebase email/password sign-in
      const cred = await signInWithEmailAndPassword(auth, form.email, form.password); // [web:147][web:153]
      setInfo("Login successful!");
      // redirect to your protected area, e.g. /feed
      navigate("/feed");
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to login.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-300 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100 overflow-hidden relative">
      {/* Animated tricolor strip */}
      <div className="relative h-1.5 w-full overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-orange-500 via-white to-green-500 animate-pulse" />
        <div className="absolute inset-0 bg-gradient-to-r from-orange-400/50 via-white/50 to-green-400/50 blur-sm" />
      </div>

      {/* Elegant floating orbs */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute left-[10%] top-[15%] h-96 w-96 rounded-full bg-gradient-to-br from-orange-500/15 via-orange-400/8 to-transparent blur-3xl animate-pulse" />
        <div
          className="absolute right-[15%] top-[25%] h-80 w-80 rounded-full bg-gradient-to-bl from-green-500/15 via-green-400/8 to-transparent blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        />
      </div>

      <main className="relative min-h-screen flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Logo Section */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 mb-4">
              <div className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-full bg-orange-500" />
                <div className="h-2 w-2 rounded-full bg-white" />
                <div className="h-2 w-2 rounded-full bg-green-500" />
              </div>
              <Sparkles className="h-5 w-5 text-orange-400" />
            </div>

            <h1 className="text-5xl sm:text-6xl font-black tracking-tight mb-2">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-yellow-300 to-green-400">
                BharatBlog
              </span>
            </h1>
            <p className="text-slate-400 text-sm">
              Welcome back to your community
            </p>
          </div>

          {/* Login Card */}
          <div className="relative">
            {/* Card glow effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-orange-500/20 via-green-500/20 to-orange-500/20 rounded-3xl blur-xl opacity-50" />

            {/* Main card */}
            <div className="relative bg-slate-900/95 backdrop-blur-xl rounded-3xl border border-slate-700/50 p-8 sm:p-10 shadow-2xl">
              {/* Header */}
              <div className="mb-8">
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-100 mb-2">
                  Login
                </h2>
                <p className="text-slate-400 text-sm">
                  Continue your journey with BharatBlog
                </p>
              </div>

              {/* Error/Info Messages */}
              {error && (
                <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 backdrop-blur-sm">
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}

              {info && (
                <div className="mb-6 p-4 rounded-xl bg-green-500/10 border border-green-500/30 backdrop-blur-sm">
                  <p className="text-sm text-green-400">{info}</p>
                </div>
              )}

              {/* Form Fields */}
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Email Field */}
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      className="w-full pl-12 pr-4 py-4 rounded-xl border-2 border-slate-700 bg-slate-800/50 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-orange-500 focus:bg-slate-800 transition-all duration-300"
                      placeholder="you@example.com"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                    <input
                      type="password"
                      name="password"
                      value={form.password}
                      onChange={handleChange}
                      className="w-full pl-12 pr-4 py-4 rounded-xl border-2 border-slate-700 bg-slate-800/50 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-green-500 focus:bg-slate-800 transition-all duration-300"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="group relative w-full py-4 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 text-white text-lg font-bold shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 hover:scale-105 disabled:opacity-60 disabled:hover:scale-100 transition-all duration-300 overflow-hidden"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {submitting ? "Logging in..." : "Login"}
                    {!submitting && (
                      <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    )}
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </button>
              </form>

              {/* Resend Verification */}
              <button
                onClick={() => {
                  setError("");
                  setInfo("Verification email sent! Check your inbox.");
                }}
                type="button"
                className="mt-6 text-sm text-orange-400 hover:text-orange-300 transition-colors"
              >
                Resend verification email
              </button>

              {/* Divider */}
              <div className="flex items-center gap-4 my-8">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-700 to-slate-700" />
                <span className="text-xs text-slate-500 uppercase tracking-wider">
                  New here?
                </span>
                <div className="h-px flex-1 bg-gradient-to-r from-slate-700 via-slate-700 to-transparent" />
              </div>

              {/* Sign Up Link */}
              <div className="text-center">
                <p className="text-slate-400 text-sm mb-3">
                  Don&apos;t have an account yet?
                </p>
                <Link
                  to="/register"
                  className="group inline-flex items-center justify-center gap-2 px-8 py-3 rounded-xl border-2 border-slate-600 text-slate-100 font-semibold hover:border-green-500 hover:text-green-400 hover:bg-green-500/5 transition-all duration-300"
                >
                  Create Account
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          </div>

          {/* Bottom tagline */}
          <div className="mt-8 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="h-px w-8 bg-gradient-to-r from-transparent via-orange-500 to-orange-500" />
              <span className="text-xs text-slate-500">जय हिन्द</span>
              <div className="h-px w-8 bg-gradient-to-r from-green-500 via-green-500 to-transparent" />
            </div>
            <p className="text-xs text-slate-600">Proudly Made in India</p>
          </div>
        </div>
      </main>
    </div>
  );
}
