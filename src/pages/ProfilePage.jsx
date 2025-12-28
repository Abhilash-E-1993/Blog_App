// src/pages/ProfilePage.jsx
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
          currentUser.displayName || (emailVal ? emailVal.split("@")[0] : "");

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
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-emerald-500/70 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-300 text-sm">Loading your BharatBlog profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto py-4">
      {/* Header */}
      <div className="mb-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 mb-3">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          <span className="text-[11px] font-semibold tracking-[0.2em] uppercase text-emerald-300">
            BharatBlog Profile
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-50 tracking-tight">
          Your profile
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Update how you appear across BharatBlog.
        </p>
      </div>

      {/* Alerts */}
      {error && (
        <div className="mb-3 text-sm text-red-400 bg-red-950/40 border border-red-500/40 px-3 py-2 rounded-lg">
          {error}
        </div>
      )}

      {info && (
        <div className="mb-3 text-sm text-emerald-300 bg-emerald-950/30 border border-emerald-500/40 px-3 py-2 rounded-lg">
          {info}
        </div>
      )}

      {/* Card */}
      <div className="relative">
        <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/20 via-sky-500/15 to-emerald-500/20 rounded-3xl blur-xl opacity-60" />
        <div className="relative bg-slate-950/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl backdrop-blur-xl">
          {/* Avatar section */}
          <div className="flex items-start gap-4 mb-6">
            <div className="relative">
              <div className="h-20 w-20 rounded-full overflow-hidden border-2 border-emerald-500/60 bg-slate-900 flex items-center justify-center shadow-md shadow-emerald-500/30">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Avatar preview"
                    className="h-full w-full object-cover"
                  />
                ) : avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={name || email}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-xs text-slate-400">No avatar</span>
                )}
              </div>
            </div>

            <div className="flex-1 space-y-2">
              <p className="text-sm font-medium text-slate-100">
                Profile picture
              </p>

              <div className="flex flex-col sm:flex-row gap-2">
                {/* Styled choose avatar */}
                <label className="inline-flex items-center justify-center px-3 py-1.5 rounded-full bg-slate-800 text-slate-100 text-xs font-medium cursor-pointer hover:bg-slate-700 border border-slate-600">
                  Choose image
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </label>

                {/* Upload button */}
                <button
                  type="button"
                  onClick={handleUploadAvatar}
                  disabled={!avatarFile || uploadingAvatar}
                  className="inline-flex items-center justify-center px-3 py-1.5 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-xs font-semibold shadow-md shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 transition-all"
                >
                  {uploadingAvatar ? "Uploading..." : "Upload avatar"}
                </button>
              </div>

              {/* File name / note */}
              {avatarFile && (
                <p className="text-[11px] text-slate-400 truncate">
                  Selected: {avatarFile.name}
                </p>
              )}
              {avatarPreview && (
                <p className="text-[11px] text-slate-500">
                  Preview only. Click “Upload avatar” to save it.
                </p>
              )}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-slate-200 mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                disabled
                className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-slate-400 text-sm cursor-not-allowed"
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
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
              <p className="mt-1 text-[11px] text-slate-400">
                This name is shown as the author on your BharatBlog posts.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-between gap-3">
              <p className="text-[11px] text-slate-500">
                Changes apply to your profile and all your posts.
              </p>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center px-4 py-2 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-xs font-semibold hover:shadow-lg hover:shadow-emerald-500/30 disabled:opacity-60 transition-all"
              >
                {saving ? "Saving..." : "Save changes"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
