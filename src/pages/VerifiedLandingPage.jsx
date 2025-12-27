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
          navigate("/", { replace: true });
          return;
        }
      }

      unsub = onIdTokenChanged(auth, async (user) => {
        if (!user) return;
        await reload(user);
        if (user.emailVerified) {
          await getIdToken(user, true);
          navigate("/", { replace: true });
        }
      });
    };

    init();

    return () => {
      if (unsub) unsub();
    };
  }, [currentUser, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <div className="bg-slate-800 p-6 rounded-lg shadow-md max-w-md w-full text-center">
        <h1 className="text-2xl font-semibold text-white mb-4">
          Email verified
        </h1>
        <p className="text-slate-200">
          Hang on while we redirect you to the app. If nothing happens,
          you can close this tab and open the app again.
        </p>
      </div>
    </div>
  );
}
