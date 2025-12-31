// src/pages/UserProfilePage.jsx
import { useEffect, useMemo, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  orderBy,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import { getOptimizedImageUrl } from "../lib/cloudinary";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { findOrCreateConversation } from "../lib/chat";

export default function UserProfilePage() {
  const { uid } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [userProfile, setUserProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState("");

  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [postsError, setPostsError] = useState("");

  const [startingChat, setStartingChat] = useState(false);

  useEffect(() => {
    const loadUserProfile = async () => {
      if (!uid) {
        setUserProfile(null);
        setProfileLoading(false);
        return;
      }

      try {
        setProfileLoading(true);
        setProfileError("");

        const ref = doc(db, "users", uid);
        const snap = await getDoc(ref);

        if (!snap.exists()) {
          setUserProfile(null);
          setProfileError("User profile not found.");
        } else {
          const data = snap.data();
          const email = data.email || "";
          const baseName =
            data.name ||
            (email ? email.split("@")[0] : "BharatBlog user");

          const avatarUrl =
            data.avatarUrl ||
            (email
              ? `https://api.dicebear.com/7.x/bottts/png?seed=${encodeURIComponent(
                  email
                )}`
              : "");

          const bio = data.bio || "";

          setUserProfile({
            name: baseName,
            email,
            avatarUrl,
            bio,
          });
        }
      } catch (err) {
        console.error(err);
        setProfileError("Failed to load user profile.");
      } finally {
        setProfileLoading(false);
      }
    };

    loadUserProfile();
  }, [uid]);

  useEffect(() => {
    const fetchUserPosts = async () => {
      if (!uid) {
        setPosts([]);
        setPostsLoading(false);
        return;
      }

      try {
        setPostsLoading(true);
        setPostsError("");

        const postsRef = collection(db, "posts");
        const q = query(
          postsRef,
          where("authorId", "==", uid),
          orderBy("createdAt", "desc")
        );

        const snap = await getDocs(q);

        if (snap.empty) {
          setPosts([]);
        } else {
          const postsData = snap.docs.map((docSnap) => ({
            id: docSnap.id,
            ...docSnap.data(),
          }));
          setPosts(postsData);
        }
      } catch (err) {
        console.error(err);
        setPostsError("Failed to load creator content.");
      } finally {
        setPostsLoading(false);
      }
    };

    fetchUserPosts();
  }, [uid]);

  const handleStartChat = async () => {
    if (!currentUser || !uid || startingChat || !userProfile) return;

    try {
      setStartingChat(true);

      const otherUser = {
        uid,
        name: userProfile.name,
        avatarUrl: userProfile.avatarUrl || "",
      };

      const conv = await findOrCreateConversation(currentUser, otherUser);
      navigate(`/chat/${conv.id}`);
    } catch (err) {
      console.error("Failed to start chat:", err);
    } finally {
      setStartingChat(false);
    }
  };

  const isMe = currentUser?.uid === uid;
  const totalPosts = useMemo(() => posts.length, [posts]);
  const totalLikes = useMemo(
    () =>
      posts.reduce(
        (sum, p) => sum + (typeof p.likesCount === "number" ? p.likesCount : 0),
        0
      ),
    [posts]
  );

  if (profileLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-emerald-500/70 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-300 text-sm">Loading creator profile...</p>
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="max-w-3xl mx-auto py-8 px-4 sm:px-0">
        <div className="rounded-2xl border border-dashed border-slate-700/80 bg-slate-900/70 px-6 py-8">
          <p className="text-slate-200 text-base font-medium mb-2">
            This BharatBlog creator profile could not be found.
          </p>
          <p className="text-slate-400 text-sm mb-4">
            The account may have been removed or the link might be incorrect.
          </p>
          <Link
            to="/feed"
            className="inline-flex items-center gap-1 text-sm text-emerald-400 hover:text-emerald-300"
          >
            <span>← Back to feed</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="py-4">
      {/* top header same style as ProfilePage */}
      <div className="mb-6 flex items-start justify-between gap-3 max-w-5xl mx-auto px-4 sm:px-0">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 mb-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <span className="text-[11px] font-semibold tracking-[0.2em] uppercase text-emerald-300">
              BharatBlog Creator
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-50 tracking-tight">
            {userProfile.name}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            {isMe
              ? "This is your public creator profile as seen by other readers."
              : "Public creator profile on BharatBlog."}
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate(-1)}
          className="hidden sm:inline-flex items-center rounded-full border border-slate-700 px-3 py-1 text-[11px] text-slate-300 hover:bg-slate-800"
        >
          Back
        </button>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-0 grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1.4fr)] items-start">
        {/* LEFT: profile card (view-only) */}
        <section className="relative">
          <div className="absolute -inset-1 bg-[conic-gradient(from_140deg_at_0%_0%,rgba(16,185,129,0.4),rgba(56,189,248,0.25),rgba(249,115,22,0.4),rgba(16,185,129,0.4))] rounded-3xl blur-2xl opacity-70" />
          <div className="relative bg-slate-950/90 border border-slate-800 rounded-3xl px-5 py-6 sm:px-6 sm:py-7 shadow-[0_24px_70px_rgba(15,23,42,0.95)] backdrop-blur-2xl flex flex-col gap-6 min-h-[360px]">
            {/* avatar + name + bio */}
            <div className="flex items-start gap-4">
              <div className="relative">
                <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-3xl overflow-hidden border-2 border-emerald-400/70 bg-slate-900 flex items-center justify-center shadow-[0_0_25px_rgba(16,185,129,0.5)]">
                  {userProfile.avatarUrl ? (
                    <img
                      src={userProfile.avatarUrl}
                      alt={userProfile.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-xs text-slate-400">
                      {userProfile.name?.[0]?.toUpperCase() || "U"}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex-1 space-y-1 min-w-0">
                <h2 className="text-lg sm:text-xl font-semibold text-slate-50 truncate">
                  {userProfile.name}
                </h2>
                {userProfile.email && (
                  <p className="text-xs text-slate-400 break-all">
                    {userProfile.email}
                  </p>
                )}

                <div className="mt-3 text-xs text-slate-200 leading-relaxed max-h-32 overflow-y-auto">
                  {userProfile.bio ? (
                    <div className="prose prose-invert prose-p:mb-1 max-w-none text-xs">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {userProfile.bio}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-slate-500">
                      This creator has not added a bio yet.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* stats */}
            <div className="grid grid-cols-3 gap-3 rounded-2xl bg-slate-900/70 border border-slate-800 px-3 py-3 text-center text-xs sm:text-sm">
              <div>
                <p className="text-[10px] sm:text-xs text-slate-400 uppercase tracking-wide">
                  Stories
                </p>
                <p className="text-base sm:text-lg font-semibold text-slate-50">
                  {totalPosts}
                </p>
              </div>
              <div>
                <p className="text-[10px] sm:text-xs text-slate-400 uppercase tracking-wide">
                  Applause
                </p>
                <p className="text-base sm:text-lg font-semibold text-emerald-400">
                  {totalLikes}
                </p>
              </div>
              <div>
                <p className="text-[10px] sm:text-xs text-slate-400 uppercase tracking-wide">
                  Role
                </p>
                <p className="text-base sm:text-lg font-semibold text-slate-50">
                  Author
                </p>
              </div>
            </div>

            {/* CTA */}
            <div className="flex items-center justify-between gap-3">
              <p className="text-[10px] text-slate-500">
                Explore this creator&apos;s latest writing on the right.
              </p>
              {isMe ? (
                <Link
                  to="/profile"
                  className="inline-flex items-center justify-center px-4 py-2 rounded-full bg-slate-800 text-slate-100 text-[11px] font-medium hover:bg-slate-700"
                >
                  Edit your profile
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={handleStartChat}
                  disabled={startingChat}
                  className="inline-flex items-center justify-center px-4 py-2 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-[11px] font-semibold shadow-md shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:scale-105 disabled:opacity-60 disabled:hover:scale-100 transition-all"
                >
                  {startingChat ? "Starting chat..." : "Message"}
                </button>
              )}
            </div>
          </div>
        </section>

        {/* RIGHT: posts list */}
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-slate-50">
                Recent writing
              </h2>
              <p className="text-xs text-slate-400">
                Articles and updates published by {userProfile.name}.
              </p>
            </div>
          </div>

          {postsLoading && (
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <div className="w-5 h-5 border-2 border-emerald-500/70 border-t-transparent rounded-full animate-spin" />
              <span>Loading posts...</span>
            </div>
          )}

          {postsError && !postsLoading && (
            <div className="mb-3 text-sm text-red-400 bg-red-950/40 border border-red-500/40 px-3 py-2 rounded-lg">
              {postsError}
            </div>
          )}

          {!postsLoading && !postsError && posts.length === 0 && (
            <div className="mt-2 rounded-2xl border border-dashed border-slate-700/70 bg-slate-900/60 px-4 py-6 text-center">
              <p className="text-slate-200 text-sm font-medium mb-1">
                No stories published yet.
              </p>
              <p className="text-slate-400 text-xs mb-3">
                This creator has not shared any BharatBlog posts so far.
              </p>
            </div>
          )}

          {!postsLoading && !postsError && posts.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2">
              {posts.map((post) => {
                const previewContent = post.content
                  ? post.content.slice(0, 130)
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

                        <Link
                          to={`/post/${post.slug}`}
                          className="text-emerald-400 hover:text-emerald-300"
                        >
                          Read story →
                        </Link>
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
