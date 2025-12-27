import { useEffect, useState } from "react";
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import { uploadImageToCloudinary } from "../lib/cloudinary";

export default function ProfilePage() {
  const { currentUser, profile, setProfile } = useAuth();

  const [name, setName] = useState(profile?.name || "");
  const [email, setEmail] = useState(profile?.email || "");
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatarUrl || "");
  const [initialName, setInitialName] = useState(profile?.name || "");
  const [loading, setLoading] = useState(!profile);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState("");

  useEffect(() => {
    const loadProfile = async () => {
      if (!currentUser) return;
      if (profile) {
        setName(profile.name);
        setInitialName(profile.name);
        setEmail(profile.email);
        setAvatarUrl(profile.avatarUrl);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");
        setInfo("");

        const ref = doc(db, "users", currentUser.uid);
        const snap = await getDoc(ref);

        const emailVal = currentUser.email || "";
        const baseName =
          currentUser.displayName ||
          (emailVal ? emailVal.split("@")[0] : "");

        if (snap.exists()) {
          const data = snap.data();
          const nameVal = data.name || baseName;
          const avatarVal =
            data.avatarUrl ||
            (emailVal
              ? `https://api.dicebear.com/7.x/bottts/png?seed=${encodeURIComponent(
                  emailVal
                )}`
              : "");
          setName(nameVal);
          setInitialName(nameVal);
          setEmail(emailVal);
          setAvatarUrl(avatarVal);
          setProfile({ name: nameVal, avatarUrl: avatarVal, email: emailVal });
        } else {
          const avatarVal =
            emailVal
              ? `https://api.dicebear.com/7.x/bottts/png?seed=${encodeURIComponent(
                  emailVal
                )}`
              : "";
          setName(baseName);
          setInitialName(baseName);
          setEmail(emailVal);
          setAvatarUrl(avatarVal);
          setProfile({ name: baseName, avatarUrl: avatarVal, email: emailVal });
        }
      } catch (err) {
        console.error(err);
        setError("Failed to load profile.");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [currentUser, profile, setProfile]);

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleUploadAvatar = async () => {
    setError("");
    setInfo("");
    if (!avatarFile) {
      setError("Please select an avatar image first.");
      return;
    }

    try {
      setUploadingAvatar(true);
      const url = await uploadImageToCloudinary(avatarFile);

      const userRef = doc(db, "users", currentUser.uid);
      await updateDoc(userRef, { avatarUrl: url });

      setAvatarUrl(url);
      setAvatarFile(null);
      setAvatarPreview("");

      setProfile((prev) =>
        prev ? { ...prev, avatarUrl: url } : { name, email, avatarUrl: url }
      );

      setInfo("Avatar updated successfully.");
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to upload avatar.");
    } finally {
      setUploadingAvatar(false);
    }
  };

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

      const userRef = doc(db, "users", currentUser.uid);
      await updateDoc(userRef, { name: trimmedName });

      const postsRef = collection(db, "posts");
      const q = query(postsRef, where("authorId", "==", currentUser.uid));
      const snap = await getDocs(q);

      const updates = snap.docs.map((postDoc) =>
        updateDoc(postDoc.ref, { authorName: trimmedName })
      );
      await Promise.all(updates);

      setInitialName(trimmedName);
      setProfile((prev) =>
        prev
          ? { ...prev, name: trimmedName }
          : { name: trimmedName, email, avatarUrl }
      );
      setInfo("Profile and your posts updated successfully.");
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

      {/* Avatar */}
      <div className="flex items-center gap-4 mb-6">
        <div className="h-16 w-16 rounded-full overflow-hidden border border-slate-600 bg-slate-800 flex items-center justify-center">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={name || email}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="text-sm text-slate-400">No avatar</span>
          )}
        </div>

        <div className="flex-1 space-y-2">
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="text-xs text-slate-200"
            />
            <button
              type="button"
              onClick={handleUploadAvatar}
              disabled={!avatarFile || uploadingAvatar}
              className="px-3 py-1.5 rounded bg-slate-700 text-slate-100 text-xs font-medium hover:bg-slate-600 disabled:opacity-60"
            >
              {uploadingAvatar ? "Uploading..." : "Upload avatar"}
            </button>
          </div>
          {avatarPreview && (
            <p className="text-xs text-slate-400">
              Preview selected file (not saved yet).
            </p>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-slate-200 mb-1">Email</label>
          <input
            type="email"
            value={email}
            disabled
            className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-slate-400 cursor-not-allowed"
          />
        </div>

        <div>
          <label className="block text-sm text-slate-200 mb-1">
            Display name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded border border-slate-600 bg-slate-900 px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
