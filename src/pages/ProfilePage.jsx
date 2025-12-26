import { useEffect, useState } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";

export default function ProfilePage() {
  const { currentUser } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [initialName, setInitialName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  useEffect(() => {
    const loadProfile = async () => {
      if (!currentUser) return;

      try {
        setLoading(true);
        setError("");
        setInfo("");

        setEmail(currentUser.email || "");

        const ref = doc(db, "users", currentUser.uid);
        const snap = await getDoc(ref);

        if (snap.exists()) {
          const data = snap.data();
          const userName =
            data.name ||
            currentUser.displayName ||
            (currentUser.email ? currentUser.email.split("@")[0] : "");
          setName(userName);
          setInitialName(userName);
        } else {
          const fallbackName =
            currentUser.displayName ||
            (currentUser.email ? currentUser.email.split("@")[0] : "");
          setName(fallbackName);
          setInitialName(fallbackName);
        }
      } catch (err) {
        console.error(err);
        setError("Failed to load profile.");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [currentUser]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setInfo("");

    if (!currentUser) {
      setError("You must be logged in.");
      return;
    }

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Name cannot be empty.");
      return;
    }

    if (trimmedName === initialName) {
      setInfo("No changes to save.");
      return;
    }

    try {
      setSaving(true);

      const ref = doc(db, "users", currentUser.uid);
      await updateDoc(ref, { name: trimmedName }); // only name, uid unchanged

      setInitialName(trimmedName);
      setInfo("Profile updated successfully.");
    } catch (err) {
      console.error(err);
      setError("Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center mt-10">
        <p className="text-slate-300">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-semibold text-white mb-4">Profile</h1>

      {error && (
        <div className="mb-3 text-sm text-red-400 bg-red-950/40 border border-red-500/40 px-3 py-2 rounded">
          {error}
        </div>
      )}

      {info && (
        <div className="mb-3 text-sm text-emerald-300 bg-emerald-950/30 border border-emerald-500/40 px-3 py-2 rounded">
          {info}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email (read-only) */}
        <div>
          <label className="block text-sm text-slate-200 mb-1">Email</label>
          <input
            type="email"
            value={email}
            disabled
            className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-slate-400 cursor-not-allowed"
          />
        </div>

        {/* Name (editable) */}
        <div>
          <label className="block text-sm text-slate-200 mb-1">
            Display name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded border border-slate-600 bg-slate-900 px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="Your name"
          />
          <p className="mt-1 text-xs text-slate-400">
            This name is shown as the author on your posts.
          </p>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center justify-center px-4 py-2 rounded-md bg-emerald-500 text-white font-medium hover:bg-emerald-600 disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save changes"}
        </button>
      </form>
    </div>
  );
}
