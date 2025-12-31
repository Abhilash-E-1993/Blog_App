// src/pages/ProfilePage.jsx
import { useEffect, useState, useMemo } from "react";
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  orderBy,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import { uploadImageToCloudinary } from "../lib/cloudinary";
import { getOptimizedImageUrl } from "../lib/cloudinary";
import { Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function ProfilePage() {
  const { currentUser, profile, setProfile } = useAuth();

  // form state
  const [name, setName] = useState(profile?.name || "");
  const [email, setEmail] = useState(profile?.email || "");
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatarUrl || "");
  const [bio, setBio] = useState(profile?.bio || "");

  const [initialName, setInitialName] = useState(profile?.name || "");
  const [initialBio, setInitialBio] = useState(profile?.bio || "");

  // UI state
  const [loading, setLoading] = useState(!profile);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState("");

  // posts state
  const [myPosts, setMyPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [postsError, setPostsError] = useState("");

  // derived stats
  const totalPosts = useMemo(() => myPosts.length, [myPosts]);
  const totalLikes = useMemo(
    () =>
      myPosts.reduce(
        (sum, p) => sum + (typeof p.likesCount === "number" ? p.likesCount : 0),
        0
      ),
    [myPosts]
  );

  // Load profile (bio is just a field on users, not a collection). [web:384]
  useEffect(() => {
    const loadProfile = async () => {
      if (!currentUser) return;

      try {
        setLoading(true);
        setError("");
        setInfo("");

        if (profile) {
          setName(profile.name || "");
          setInitialName(profile.name || "");
          setEmail(profile.email || "");
          setAvatarUrl(profile.avatarUrl || "");
          setBio(profile.bio || "");
          setInitialBio(profile.bio || "");
          return;
        }

        const ref = doc(db, "users", currentUser.uid);
        const snap = await getDoc(ref);

        const emailVal = currentUser.email || "";
        const baseName =
          currentUser.displayName || (emailVal ? emailVal.split("@")[0] : "");

        let nameVal = baseName;
        let avatarVal = emailVal
          ? `https://api.dicebear.com/7.x/bottts/png?seed=${encodeURIComponent(
              emailVal
            )}`
          : "";
        let bioVal = "";

        if (snap.exists()) {
          const data = snap.data();
          nameVal = data.name || baseName;
          avatarVal =
            data.avatarUrl ||
            (emailVal
              ? `https://api.dicebear.com/7.x/bottts/png?seed=${encodeURIComponent(
                  emailVal
                )}`
              : "");
          bioVal = data.bio || "";
        }

        setName(nameVal);
        setInitialName(nameVal);
        setEmail(emailVal);
        setAvatarUrl(avatarVal);
        setBio(bioVal);
        setInitialBio(bioVal);

        setProfile({
          name: nameVal,
          avatarUrl: avatarVal,
          email: emailVal,
          bio: bioVal,
        });
      } catch (err) {
        console.error(err);
        setError("Failed to load profile.");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.uid]);

  // Load user's posts
  useEffect(() => {
    const fetchMyPosts = async () => {
      if (!currentUser) {
        setMyPosts([]);
        setPostsLoading(false);
        return;
      }

      try {
        setPostsLoading(true);
        setPostsError("");

        const postsRef = collection(db, "posts");
        const q = query(
          postsRef,
          where("authorId", "==", currentUser.uid),
          orderBy("createdAt", "desc")
        );
        const snap = await getDocs(q);

        if (snap.empty) {
          setMyPosts([]);
        } else {
          const postsData = snap.docs.map((docSnap) => ({
            id: docSnap.id,
            ...docSnap.data(),
          }));
          setMyPosts(postsData);
        }
      } catch (err) {
        console.error(err);
        setPostsError("Failed to load your posts.");
      } finally {
        setPostsLoading(false);
      }
    };

    fetchMyPosts();
  }, [currentUser?.uid]);

  // avatar handlers
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
      await updateDoc(userRef, { avatarUrl: url }); // field-only update [web:387]

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

  // profile form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setInfo("");

    if (!currentUser) {
      setError("You must be logged in.");
      return;
    }

    const trimmedName = name.trim();
    const trimmedBio = bio.trim();

    if (!trimmedName) {
      setError("Name cannot be empty.");
      return;
    }

    if (trimmedName === initialName && trimmedBio === initialBio) {
      setInfo("No changes to save.");
      return;
    }

    try {
      setSaving(true);

      const userRef = doc(db, "users", currentUser.uid);
      // creates/updates "bio" field on the user document, no new collection. [web:384]
      await updateDoc(userRef, {
        name: trimmedName,
        bio: trimmedBio,
      });

      if (trimmedName !== initialName) {
        const postsRef = collection(db, "posts");
        const q = query(postsRef, where("authorId", "==", currentUser.uid));
        const snap = await getDocs(q);

        const updates = snap.docs.map((postDoc) =>
          updateDoc(postDoc.ref, { authorName: trimmedName })
        );
        await Promise.all(updates);
      }

      setInitialName(trimmedName);
      setInitialBio(trimmedBio);
      setProfile((prev) =>
        prev
          ? { ...prev, name: trimmedName, bio: trimmedBio }
          : { name: trimmedName, email, avatarUrl, bio: trimmedBio }
      );
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
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-emerald-500/70 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-300 text-sm">
            Loading your BharatBlog profile...
          </p>
        </div>
      </div>
    );
  }

  const joinedYear = currentUser?.metadata?.creationTime
    ? new Date(currentUser.metadata.creationTime).getFullYear()
    : "—";

  return (
    <div className="py-4">
      {/* header */}
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 mb-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <span className="text-[11px] font-semibold tracking-[0.2em] uppercase text-emerald-300">
              BharatBlog Profile
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-50 tracking-tight">
            Your creator hub
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Craft your identity on the left, explore your stories on the right.
          </p>
        </div>

        <Link
          to="/create"
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500 text-white text-[11px] font-medium hover:bg-emerald-600 transition-colors"
        >
          <span className="text-sm leading-none">+</span>
          <span>New post</span>
        </Link>
      </div>

      {/* alerts */}
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

      {/* layout */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1.5fr)] items-start">
        {/* LEFT: profile card */}
        <section className="relative">
          <div className="absolute -inset-1 bg-[conic-gradient(from_140deg_at_0%_0%,rgba(16,185,129,0.4),rgba(56,189,248,0.25),rgba(249,115,22,0.4),rgba(16,185,129,0.4))] rounded-3xl blur-2xl opacity-60" />
          <div className="relative bg-slate-950/90 border border-slate-800 rounded-3xl px-5 py-6 sm:px-6 sm:py-7 shadow-[0_24px_70px_rgba(15,23,42,0.9)] backdrop-blur-2xl flex flex-col gap-6">
            {/* avatar + basic info + bio */}
            <div className="flex items-start gap-4">
              <div className="relative flex-shrink-0">
                <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-3xl overflow-hidden border-2 border-emerald-400/70 bg-slate-900 flex items-center justify-center shadow-[0_0_25px_rgba(16,185,129,0.5)]">
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

              <div className="flex-1 space-y-1 min-w-0">
                <h2 className="text-lg sm:text-xl font-semibold text-slate-50 truncate">
                  {name || "BharatBlog author"}
                </h2>
                <p className="text-xs text-slate-400 break-all">{email}</p>

                <div className="mt-3 text-xs text-slate-200 leading-relaxed max-h-32 overflow-y-auto">
                  {bio ? (
                    <div className="prose prose-invert prose-p:mb-1 max-w-none text-xs">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {bio}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-slate-500">
                      Add a short bio so readers know who is behind these
                      stories.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* stats */}
            <div className="grid grid-cols-3 gap-3 rounded-2xl bg-slate-900/70 border border-slate-800 px-3 py-3 text-center text-xs sm:text-sm">
              <div>
                <p className="text-[10px] sm:text-xs text-slate-400 uppercase tracking-wide">
                  Posts
                </p>
                <p className="text-base sm:text-lg font-semibold text-slate-50">
                  {totalPosts}
                </p>
              </div>
              <div>
                <p className="text-[10px] sm:text-xs text-slate-400 uppercase tracking-wide">
                  Likes
                </p>
                <p className="text-base sm:text-lg font-semibold text-emerald-400">
                  {totalLikes}
                </p>
              </div>
              <div>
                <p className="text-[10px] sm:text-xs text-slate-400 uppercase tracking-wide">
                  Joined
                </p>
                <p className="text-base sm:text-lg font-semibold text-slate-50">
                  {joinedYear}
                </p>
              </div>
            </div>

            {/* avatar + form controls */}
            <div className="flex flex-col gap-4">
              {/* avatar controls */}
              <div>
                <p className="text-xs font-medium text-slate-100 mb-1.5">
                  Profile picture
                </p>
                <div className="flex flex-wrap gap-2">
                  <label className="inline-flex items-center justify-center px-3 py-1.5 rounded-full bg-slate-800 text-slate-100 text-[11px] font-medium cursor-pointer hover:bg-slate-700 border border-slate-600">
                    Choose image
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                  </label>

                  <button
                    type="button"
                    onClick={handleUploadAvatar}
                    disabled={!avatarFile || uploadingAvatar}
                    className="inline-flex items-center justify-center px-3 py-1.5 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-[11px] font-semibold shadow-md shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 transition-all"
                  >
                    {uploadingAvatar ? "Uploading..." : "Upload avatar"}
                  </button>
                </div>
                {avatarFile && (
                  <p className="mt-1 text-[10px] text-slate-400 truncate">
                    Selected: {avatarFile.name}
                  </p>
                )}
                {avatarPreview && (
                  <p className="text-[10px] text-slate-500">
                    Preview only. Click “Upload avatar” to save it.
                  </p>
                )}
              </div>

              {/* name + bio form */}
              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs text-slate-200 mb-1">
                    Display name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="Your public name"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-200 mb-1">
                    Bio
                  </label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={3}
                    maxLength={280}
                    placeholder="Write a short intro. Markdown supported for basic emphasis."
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 text-xs resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                  <div className="mt-1 flex items-center justify-between gap-2">
                    <p className="text-[10px] text-slate-400">
                      Keep it under 280 characters. *Italic* and **bold** are
                      supported.
                    </p>
                    <span className="text-[10px] text-slate-500">
                      {bio.length}/280
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <p className="text-[10px] text-slate-500">
                    Saving updates your name and bio everywhere.
                  </p>
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center justify-center px-4 py-2 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-[11px] font-semibold hover:shadow-lg hover:shadow-emerald-500/30 disabled:opacity-60 transition-all"
                  >
                    {saving ? "Saving..." : "Save changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </section>

        {/* RIGHT: stories */}
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-slate-50">
                Your stories
              </h2>
              <p className="text-xs text-slate-400">
                Everything you have published on BharatBlog.
              </p>
            </div>
            <Link
              to="/create"
              className="inline-flex lg:hidden items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500 text-white text-[11px] font-medium hover:bg-emerald-600 transition-colors"
            >
              <span className="text-sm leading-none">+</span>
              <span>New</span>
            </Link>
          </div>

          {postsLoading && (
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <div className="w-5 h-5 border-2 border-emerald-500/70 border-t-transparent rounded-full animate-spin" />
              <span>Loading your posts...</span>
            </div>
          )}

          {postsError && !postsLoading && (
            <div className="text-sm text-red-400 bg-red-950/40 border border-red-500/40 px-3 py-2 rounded-lg">
              {postsError}
            </div>
          )}

          {!postsLoading && !postsError && myPosts.length === 0 && (
            <div className="mt-2 rounded-2xl border border-dashed border-slate-700/70 bg-slate-900/60 px-4 py-6 text-center">
              <p className="text-slate-200 text-sm font-medium mb-1">
                You haven’t written any posts yet.
              </p>
              <p className="text-slate-400 text-xs mb-3">
                Create your first story and it will appear here.
              </p>
              <Link
                to="/create"
                className="inline-flex items-center justify-center px-4 py-2 rounded-full bg-emerald-500 text-white text-xs font-medium hover:bg-emerald-600"
              >
                Write a post
              </Link>
            </div>
          )}

          {!postsLoading && !postsError && myPosts.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2">
              {myPosts.map((post) => {
                const previewContent = post.content
                  ? String(post.content).slice(0, 160)
                  : "";
                const createdAt = post.createdAt;
                const date = createdAt?.toDate ? createdAt.toDate() : createdAt;
                const createdAtText =
                  date instanceof Date ? date.toLocaleDateString() : "";
                const thumbUrl = post.imageUrl
                  ? getOptimizedImageUrl(post.imageUrl, { width: 500 })
                  : "";

                return (
                  <article
                    key={post.id}
                    className="group relative overflow-hidden rounded-2xl bg-slate-900/80 border border-slate-800/80 hover:border-emerald-500/60 shadow-[0_10px_26px_rgba(15,23,42,0.9)] transition-all duration-300 hover:-translate-y-1 flex flex-col"
                  >
                    <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-emerald-500 via-sky-500 to-emerald-500 opacity-70" />

                    {post.imageUrl && (
                      <Link
                        to={`/post/${post.slug}`}
                        className="block h-24 w-full overflow-hidden"
                      >
                        <img
                          src={thumbUrl}
                          alt={post.title}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.05]"
                          loading="lazy"
                        />
                      </Link>
                    )}

                    <div className="p-4 flex flex-col gap-2 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <Link
                          to={`/post/${post.slug}`}
                          className="inline-block text-sm font-semibold text-slate-50 hover:text-emerald-300 hover:underline line-clamp-2"
                        >
                          {post.title}
                        </Link>
                        <span className="text-[10px] text-slate-400 whitespace-nowrap">
                          {createdAtText}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-300 line-clamp-3 prose prose-invert max-w-none">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {previewContent}
                        </ReactMarkdown>
                      </div>

                      <div className="mt-2 flex items-center justify-between gap-2 text-[11px]">
                        <div className="inline-flex items-center gap-2">
                          {typeof post.likesCount === "number" && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-slate-800/80 px-2 py-0.5 text-slate-300">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                              {post.likesCount} likes
                            </span>
                          )}
                          {post.category && (
                            <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full bg-slate-800/80 text-slate-300">
                              {post.category}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <Link
                            to={`/edit/${post.id}`}
                            className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-100"
                          >
                            Edit
                          </Link>
                          <Link
                            to={`/post/${post.slug}`}
                            className="text-emerald-400 hover:text-emerald-300"
                          >
                            View →
                          </Link>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
