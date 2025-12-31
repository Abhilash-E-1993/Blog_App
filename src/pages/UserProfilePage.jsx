// src/pages/UserProfilePage.jsx
import { useEffect, useState } from "react";
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

          setUserProfile({
            name: baseName,
            email,
            avatarUrl,
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
        setPostsError("Failed to load user posts.");
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

  if (profileLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-emerald-500/70 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-300 text-sm">Loading user profile...</p>
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="max-w-3xl mx-auto py-8">
        <div className="rounded-2xl border border-dashed border-slate-700/80 bg-slate-900/70 px-6 py-8">
          <p className="text-slate-200 text-base font-medium mb-2">
            This BharatBlog user profile could not be found.
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

  const isMe = currentUser?.uid === uid;

  return (
    <div className="max-w-3xl mx-auto py-6 px-4 sm:px-0">
      {/* Header */}
      <div className="mb-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 mb-3">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          <span className="text-[11px] font-semibold tracking-[0.2em] uppercase text-emerald-300">
            BharatBlog User
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-50 tracking-tight">
          {userProfile.name}
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          {isMe
            ? "This is your public profile as seen by other users."
            : "Public profile on BharatBlog."}
        </p>
      </div>

      {/* Profile card */}
      <div className="mb-6 rounded-3xl bg-slate-950/90 border border-slate-800 p-5 shadow-xl backdrop-blur-xl flex items-start gap-4">
        <div className="h-20 w-20 rounded-full overflow-hidden border-2 border-emerald-500/60 bg-slate-900 flex items-center justify-center shadow-md shadow-emerald-500/30">
          {userProfile.avatarUrl ? (
            <img
              src={userProfile.avatarUrl}
              alt={userProfile.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="text-xs text-slate-400">No avatar</span>
          )}
        </div>
        <div className="flex-1 space-y-1">
          <p className="text-sm text-slate-100 font-medium">
            {userProfile.name}
          </p>
          {userProfile.email && (
            <p className="text-xs text-slate-400">{userProfile.email}</p>
          )}

          {isMe ? (
            <Link
              to="/profile"
              className="inline-flex items-center justify-center px-3 py-1.5 mt-2 rounded-full bg-slate-800 text-slate-100 text-[11px] font-medium hover:bg-slate-700"
            >
              Edit your profile
            </Link>
          ) : (
            <button
              type="button"
              onClick={handleStartChat}
              disabled={startingChat}
              className="inline-flex items-center justify-center px-3 py-1.5 mt-2 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-[11px] font-semibold shadow-md shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:scale-105 disabled:opacity-60 disabled:hover:scale-100 transition-all"
            >
              {startingChat ? "Starting chat..." : "Message"}
            </button>
          )}
        </div>
      </div>

      {/* User posts section (same as before) */}
      <div className="mt-6">
        <h2 className="text-xl font-semibold text-slate-50 mb-2">
          Posts by {userProfile.name}
        </h2>
        <p className="text-xs text-slate-400 mb-4">
          All public posts written by this user on BharatBlog.
        </p>

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
          <div className="mt-3 rounded-2xl border border-dashed border-slate-700/70 bg-slate-900/60 px-4 py-6 text-center">
            <p className="text-slate-200 text-sm font-medium mb-1">
              No posts yet.
            </p>
            <p className="text-slate-400 text-xs mb-3">
              This user has not published any BharatBlog posts yet.
            </p>
          </div>
        )}

        {!postsLoading && !postsError && posts.length > 0 && (
          <div className="mt-3 space-y-4">
            {posts.map((post) => {
              const previewContent = post.content
                ? post.content.slice(0, 150)
                : "";
              const createdAt = post.createdAt;
              const date = createdAt?.toDate ? createdAt.toDate() : createdAt;
              const createdAtText =
                date instanceof Date ? date.toLocaleString() : "";

              const thumbUrl = post.imageUrl
                ? getOptimizedImageUrl(post.imageUrl, { width: 400 })
                : "";

              return (
                <article
                  key={post.id}
                  className="relative overflow-hidden rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500/50 transition-colors shadow-sm shadow-black/30"
                >
                  <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-emerald-500 via-sky-500 to-emerald-500 opacity-60" />

                  <div className="p-4 flex flex-col sm:flex-row gap-4">
                    {post.imageUrl && (
                      <Link
                        to={`/post/${post.slug}`}
                        className="hidden sm:block h-20 w-28 rounded-xl overflow-hidden border border-slate-700 flex-shrink-0"
                      >
                        <img
                          src={thumbUrl}
                          alt={post.title}
                          className="h-full w-full object-cover hover:scale-[1.02] transition-transform"
                          loading="lazy"
                        />
                      </Link>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <Link
                          to={`/post/${post.slug}`}
                          className="inline-block text-sm sm:text-base font-semibold text-emerald-400 hover:text-emerald-300 hover:underline line-clamp-2"
                        >
                          {post.title}
                        </Link>
                        <span className="text-[10px] text-slate-400 whitespace-nowrap">
                          {createdAtText}
                        </span>
                      </div>

                      <div className="mt-1 text-xs text-slate-200 line-clamp-3 prose prose-invert max-w-none">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {previewContent}
                        </ReactMarkdown>
                      </div>

                      <div className="mt-2 flex items-center justify-end gap-2 text-[11px]">
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
      </div>
    </div>
  );
}
