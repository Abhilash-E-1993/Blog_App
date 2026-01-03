// src/pages/VerifiedLandingPage.jsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import { onIdTokenChanged, reload, getIdToken } from "firebase/auth";

export default function VerifiedLandingPage() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  useEffect(() => {
    let unsub;

    const init = async () => {
      if (currentUser) {
        await reload(currentUser);
        if (currentUser.emailVerified) {
          await getIdToken(currentUser, true);
          navigate("/feed", { replace: true });
          return;
        }
      }

      unsub = onIdTokenChanged(auth, async (user) => {
        if (!user) return;
        await reload(user);
        if (user.emailVerified) {
          await getIdToken(user, true);
          navigate("/feed", { replace: true });
        }
      });
    };

    init();

    return () => {
      if (unsub) unsub();
    };
  }, [currentUser, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4">
      <div className="relative max-w-md w-full">
        {/* glow */}
        <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/25 via-sky-500/20 to-emerald-500/25 rounded-3xl blur-2xl opacity-70" />

        <div className="relative bg-slate-950/90 border border-slate-800 rounded-3xl shadow-2xl shadow-black/40 px-6 py-7 sm:px-8 sm:py-9 text-center">
          {/* success icon */}
          <div className="mx-auto mb-4 h-14 w-14 rounded-full bg-emerald-500/10 border border-emerald-400/60 flex items-center justify-center">
            <div className="h-9 w-9 rounded-full bg-emerald-500 flex items-center justify-center">
              <svg
                className="h-5 w-5 text-white"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  fill="currentColor"
                  d="M9.00039 16.2L4.80039 12L3.40039 13.4L9.00039 19L21.0004 7.00001L19.6004 5.60001L9.00039 16.2Z"
                />
              </svg>
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-slate-50 mb-2">
            Email verified
          </h1>
          <p className="text-sm text-slate-300 mb-4">
            Your email address has been successfully verified. You are all set
            to explore BharatBlog.
          </p>

          <div className="mt-4 rounded-2xl bg-slate-900/70 border border-slate-700/70 px-4 py-3 text-xs text-slate-400 text-left">
            <p className="mb-1">
              Redirecting you to your feed in a moment...
            </p>
            <p>
              If nothing happens, you can safely close this tab and open the app
              again, or click the button below.
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate("/feed", { replace: true })}
            className="mt-5 inline-flex items-center justify-center px-5 py-2.5 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-sm font-semibold hover:shadow-lg hover:shadow-emerald-500/30 transition-all"
          >
            Go to my feed
          </button>
        </div>
      </div>
    </div>
  );
}
