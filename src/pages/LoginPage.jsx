import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  signInWithEmailAndPassword,
  sendEmailVerification,
} from "firebase/auth";
import { auth } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const navigate = useNavigate();
  const { currentUser, loading } = useAuth();

  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && currentUser && currentUser.emailVerified) {
      navigate("/", { replace: true });
    }
  }, [currentUser, loading, navigate]);

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
      const cred = await signInWithEmailAndPassword(
        auth,
        form.email,
        form.password
      );

      if (!cred.user.emailVerified) {
        setInfo(
          "Your email is not verified yet. Please verify and try again."
        );
        await sendEmailVerification(cred.user);
        await auth.signOut?.();
        return;
      }

      navigate("/", { replace: true });
    } catch (err) {
      console.error(err);
      let message = "Failed to login.";
      if (err.code === "auth/user-not-found") message = "User not found.";
      if (err.code === "auth/wrong-password") message = "Incorrect password.";
      if (err.code === "auth/too-many-requests")
        message = "Too many attempts. Try again later.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <p className="text-slate-200">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <div className="bg-slate-800 p-6 rounded-lg shadow-md max-w-md w-full">
        <h1 className="text-2xl font-semibold text-white mb-4">Log in</h1>

        {error && (
          <div className="mb-3 text-sm text-red-400 bg-red-950/40 border border-red-500/40 px-3 py-2 rounded">
            {error}
          </div>
        )}

        {info && (
          <div className="mb-3 text-sm text-amber-300 bg-amber-950/30 border border-amber-500/40 px-3 py-2 rounded">
            {info}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm text-slate-200 mb-1">Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              className="w-full rounded border border-slate-600 bg-slate-900 px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-200 mb-1">
              Password
            </label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              className="w-full rounded border border-slate-600 bg-slate-900 px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full mt-2 inline-flex items-center justify-center px-4 py-2 rounded-md bg-emerald-500 text-white font-medium hover:bg-emerald-600 disabled:opacity-60"
          >
            {submitting ? "Logging in..." : "Log in"}
          </button>
        </form>

        <button
          type="button"
          onClick={async () => {
            setError("");
            setInfo("");
            try {
              const user = auth.currentUser;
              if (user && !user.emailVerified) {
                await sendEmailVerification(user);
                setInfo(
                  "Verification email sent again. Please check your inbox."
                );
              } else {
                setInfo("Please login first with your email and password.");
              }
            } catch (err) {
              console.error(err);
              setError("Could not resend verification email.");
            }
          }}
          className="mt-3 text-sm text-emerald-400 hover:underline"
        >
          Resend verification email
        </button>

        <p className="mt-4 text-sm text-slate-300">
          Don&apos;t have an account?{" "}
          <Link to="/register" className="text-emerald-400 hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
