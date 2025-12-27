// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth, db } from "../lib/firebase";
import { doc, getDoc } from "firebase/firestore";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [profile, setProfile] = useState(null); // { name, avatarUrl, email }
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user || null);

      if (!user) {
        setProfile(null);
        setLoading(false);
        return;
      }

      try {
        const ref = doc(db, "users", user.uid);
        const snap = await getDoc(ref);
        const email = user.email || "";
        const baseName =
          user.displayName || (email ? email.split("@")[0] : "");

        if (snap.exists()) {
          const data = snap.data();
          setProfile({
            name: data.name || baseName,
            avatarUrl:
              data.avatarUrl ||
              (email
                ? `https://api.dicebear.com/7.x/bottts/png?seed=${encodeURIComponent(
                    email
                  )}`
                : ""),
            email,
          });
        } else {
          setProfile({
            name: baseName,
            avatarUrl:
              email
                ? `https://api.dicebear.com/7.x/bottts/png?seed=${encodeURIComponent(
                    email
                  )}`
                : "",
            email,
          });
        }
      } catch (err) {
        console.error("Failed to load auth profile:", err);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    });

    return () => unsub();
  }, []);

  const logout = () => signOut(auth);

  const value = {
    currentUser,
    profile,
    setProfile, // so ProfilePage can update context
    loading,
    logout,
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <p className="text-slate-200">Loading...</p>
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
