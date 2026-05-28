// src/pages/RegisterPage.jsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { User, Mail, Lock, ArrowRight, Sparkles } from "lucide-react";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../lib/firebase";

const googleProvider = new GoogleAuthProvider();

export default function RegisterPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleGoogleSignIn = async () => {
    try {
      setSubmitting(true);
      setError("");
      const result = await signInWithPopup(auth, googleProvider);
      
      // Auto-create profile for Google user
      const user = result.user;
      const seed = user.email || user.uid;
      const defaultAvatarUrl = `https://api.dicebear.com/7.x/bottts/png?seed=${encodeURIComponent(seed)}`;
      
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        name: user.displayName || user.email.split("@")[0],
        email: user.email,
        avatarUrl: defaultAvatarUrl,
        createdAt: serverTimestamp(),
      }, { merge: true });
      
      navigate("/");
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

    if (!form.name || !form.email || !form.password) {
      setError("All fields are required.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    try {
      setSubmitting(true);

      const cred = await createUserWithEmailAndPassword(
        auth,
        form.email,
        form.password
      );

      const seed = form.email || cred.user.uid;
      const defaultAvatarUrl = `https://api.dicebear.com/7.x/bottts/png?seed=${encodeURIComponent(seed)}`;

      await setDoc(doc(db, "users", cred.user.uid), {
        uid: cred.user.uid,
        name: form.name,
        email: form.email,
        avatarUrl: defaultAvatarUrl,
        createdAt: serverTimestamp(),
      });

      const actionCodeSettings = {
        url: `${window.location.origin}/verified`,
        handleCodeInApp: false,
      };
      await sendEmailVerification(cred.user, actionCodeSettings);

      setSuccess(true);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to register.");
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100">
        <div className="bg-slate-900/90 border border-slate-700/60 rounded-3xl shadow-2xl max-w-md w-full p-8 text-center">
          <h1 className="text-2xl font-semibold text-white mb-4">
            Verify your email
          </h1>
          <p className="text-slate-200 mb-4">
            We have sent a verification link to{" "}
            <span className="font-semibold">{form.email}</span>. After you
            verify, you can log in to BharatBlog.
          </p>
          <button
            onClick={() => navigate("/login")}
            className="mt-2 inline-flex items-center justify-center px-6 py-3 rounded-xl bg-emerald-500 text-white font-medium hover:bg-emerald-600 transition-colors"
          >
            Go to Login
          </button>
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

      {/* Floating orbs */}
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
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 mb-3">
              <div className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-full bg-orange-500" />
                <div className="h-2 w-2 rounded-full bg-white" />
                <div className="h-2 w-2 rounded-full bg-green-500" />
              </div>
              <Sparkles className="h-5 w-5 text-orange-400" />
            </div>

            <h1 className="text-4xl sm:text-5xl font-black tracking-tight mb-1">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-yellow-300 to-green-400">
                BharatBlog
              </span>
            </h1>
            <p className="text-slate-400 text-sm">
              Join the community of Indian voices
            </p>
          </div>

          {/* Card */}
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-orange-500/20 via-green-500/20 to-orange-500/20 rounded-3xl blur-xl opacity-50" />

            <div className="relative bg-slate-900/95 backdrop-blur-xl rounded-3xl border border-slate-700/50 p-8 sm:p-10 shadow-2xl">
              <div className="mb-6">
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-100 mb-2">
                  Create account
                </h2>
                <p className="text-slate-400 text-sm">
                  Start your journey on BharatBlog
                </p>
              </div>

              {error && (
                <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30">
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}

              {/* Google Button */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={submitting}
                className="w-full mb-4 flex items-center justify-center gap-3 px-6 py-3 rounded-xl border-2 border-slate-700/50 bg-slate-800/50 hover:bg-slate-700/50 text-slate-200 font-medium transition-all hover:border-emerald-500 hover:text-emerald-300 disabled:opacity-50"
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

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full h-px bg-gradient-to-r from-transparent via-slate-600 to-transparent" />
                </div>
                <div className="relative flex justify-center text-xs uppercase text-slate-500">
                  or sign up with email
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 mt-6">
                <div>
                  <label className="block text-sm text-slate-200 mb-1">
                    Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                    <input
                      type="text"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      className="w-full rounded-xl border-2 border-slate-700 bg-slate-800/50 px-12 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="Your name"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-slate-200 mb-1">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      className="w-full rounded-xl border-2 border-slate-700 bg-slate-800/50 px-12 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="you@example.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-slate-200 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                    <input
                      type="password"
                      name="password"
                      value={form.password}
                      onChange={handleChange}
                      className="w-full rounded-xl border-2 border-slate-700 bg-slate-800/50 px-12 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-slate-200 mb-1">
                    Confirm password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                    <input
                      type="password"
                      name="confirmPassword"
                      value={form.confirmPassword}
                      onChange={handleChange}
                      className="w-full rounded-xl border-2 border-slate-700 bg-slate-800/50 px-12 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full mt-2 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-500 text-white font-semibold hover:bg-emerald-600 disabled:opacity-60 transition-colors"
                >
                  {submitting ? "Creating account..." : "Sign up"}
                  {!submitting && (
                    <ArrowRight className="h-4 w-4 translate-x-0 group-hover:translate-x-1 transition-transform" />
                  )}
                </button>
              </form>

              <p className="mt-4 text-sm text-slate-300 text-center">
                Already have an account?{" "}
                <Link to="/login" className="text-emerald-400 hover:underline">
                  Log in
                </Link>
              </p>
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
