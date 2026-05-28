// src/pages/LoginPage.jsx
import { useState, useEffect } from "react";
import { Sparkles, Mail, Lock, ArrowRight } from "lucide-react";
import { 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider 
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { Link, useNavigate } from "react-router-dom";
import { auth, db } from "../lib/firebase";

const googleProvider = new GoogleAuthProvider();

export default function LoginPage() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleGoogleSignIn = async () => {
    try {
      setSubmitting(true);
      setError("");
      
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // Create/update Firestore profile for Google user
      const seed = user.email || user.uid;
      const defaultAvatarUrl = `https://api.dicebear.com/7.x/bottts/png?seed=${encodeURIComponent(seed)}`;
      
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        name: user.displayName || user.email.split("@")[0],
        email: user.email,
        avatarUrl: defaultAvatarUrl,
        createdAt: serverTimestamp(),
      }, { merge: true });
      
      navigate("/feed");
    } catch (err) {
      console.error(err);
      setError(err.message || "Google sign-in failed.");
    } finally {
      setSubmitting(false);
    }
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
      const cred = await signInWithEmailAndPassword(auth, form.email, form.password);
      setInfo("Login successful!");
      navigate("/feed");
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to login.");
    } finally {
      setSubmitting(false);
    }
  };

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
                  Welcome back
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

              {/* Google Button */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={submitting}
                className="w-full mb-6 flex items-center justify-center gap-3 px-6 py-4 rounded-xl border-2 border-slate-700/50 bg-slate-800/50 hover:bg-slate-700/50 text-slate-200 font-medium transition-all hover:border-emerald-500 hover:text-emerald-300 disabled:opacity-50 shadow-lg hover:shadow-emerald-500/20"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continue with Google
              </button>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full h-px bg-gradient-to-r from-transparent via-slate-600 to-transparent" />
                </div>
                <div className="relative flex justify-center text-xs uppercase text-slate-500">
                  or sign in with email
                </div>
              </div>

              {/* Email/Password Form */}
              <form onSubmit={handleSubmit} className="space-y-6 mt-8">
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

              {/* Sign Up Link */}
              <div className="text-center mt-8">
                <p className="text-slate-400 text-sm mb-3">
                  Don't have an account yet?
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
