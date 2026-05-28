// src/pages/FeedPage.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  collection,
  getDocs,
  query,
  orderBy,
  limit,
  startAfter,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getOptimizedImageUrl } from "../lib/cloudinary";
import { togglePostLike } from "../lib/likes";
import { Heart } from "lucide-react";

const PAGE_SIZE = 2;

export default function FeedPage() {
  const { currentUser } = useAuth();
  const [posts, setPosts] = useState([]);
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [likeLoading, setLikeLoading] = useState({});

  const fetchPosts = async (isLoadMore = false) => {
    try {
      if (!currentUser) return;

      if (!isLoadMore) setLoading(true);
      else setLoadingMore(true);

      let qRef = query(
        collection(db, "posts"),
        orderBy("createdAt", "desc"),
        limit(PAGE_SIZE)
      );

      if (isLoadMore && lastDoc) {
        qRef = query(
          collection(db, "posts"),
          orderBy("createdAt", "desc"),
          startAfter(lastDoc),
          limit(PAGE_SIZE)
        );
      }

      const snap = await getDocs(qRef);

      if (!snap.empty) {
        const newPosts = snap.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));

        setPosts((prev) => (isLoadMore ? [...prev, ...newPosts] : newPosts));
        setLastDoc(snap.docs[snap.docs.length - 1]);
        setHasMore(snap.docs.length === PAGE_SIZE);
      } else {
        if (!isLoadMore) setPosts([]);
        setHasMore(false);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load posts.");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchPosts(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.uid]);

  const formatDate = (ts) => {
    if (!ts) return "";
    const date = ts.toDate ? ts.toDate() : ts;
    return date.toLocaleString();
  };

  const handleToggleLike = async (post) => {
    if (!currentUser) return;

    const postId = post.id;
    const userId = currentUser.uid;

    // optimistic update
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;
        const likedBy = Array.isArray(p.likedBy) ? p.likedBy : [];
        const hasLiked = likedBy.includes(userId);
        const newLikedBy = hasLiked
          ? likedBy.filter((id) => id !== userId)
          : [...likedBy, userId];
        const likesCount = typeof p.likesCount === "number" ? p.likesCount : 0;
        return {
          ...p,
          likedBy: newLikedBy,
          likesCount: likesCount + (hasLiked ? -1 : 1),
        };
      })
    );

    setLikeLoading((prev) => ({ ...prev, [postId]: true }));

    try {
      await togglePostLike(postId, userId);
    } catch (err) {
      console.error(err);
      setError("Failed to update like. Please try again.");
      fetchPosts(false);
    } finally {
      setLikeLoading((prev) => ({ ...prev, [postId]: false }));
    }
  };

  if (loading && posts.length === 0) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-emerald-500/70 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-300 text-sm">
            Loading stories from BharatBlog voices...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-6 sm:py-8 px-3 sm:px-4">
      {/* header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 mb-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-semibold tracking-[0.2em] uppercase text-emerald-300">
              Discover stories
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-50 tracking-tight">
            Latest from BharatBlog
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
            Hand‑crafted posts from the community, in a clean reading layout.
          </p>
        </div>

        <Link
          to="/create"
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 text-xs sm:text-sm text-white font-semibold shadow-[0_0_20px_rgba(249,115,22,0.45)] hover:shadow-[0_0_28px_rgba(16,185,129,0.5)] hover:scale-105 active:scale-100 transition-all"
        >
          <span className="text-base leading-none">+</span>
          <span>Write a story</span>
        </Link>
      </div>

      {error && (
        <div className="mb-4 text-sm text-red-400 bg-red-950/40 border border-red-500/40 px-3 py-2 rounded-lg">
          {error}
        </div>
      )}

      {posts.length === 0 && !loading && (
        <div className="mt-10 rounded-2xl border border-dashed border-slate-700/70 bg-slate-900/70 px-6 py-10 text-center shadow-lg shadow-black/40">
          <p className="text-slate-200 text-base font-semibold mb-1">
            Your reading lane is quiet.
          </p>
          <p className="text-slate-400 text-sm mb-4">
            Share your first story and start shaping BharatBlog.
          </p>
          <Link
            to="/create"
            className="inline-flex items-center justify-center px-4 py-2 rounded-full bg-emerald-500 text-white text-xs sm:text-sm font-medium hover:bg-emerald-600 shadow-md shadow-emerald-500/40"
          >
            Start writing
          </Link>
        </div>
      )}

      {/* posts */}
      <div className="space-y-4 sm:space-y-5">
        {posts.map((post) => {
          const previewContent = post.content ? post.content.slice(0, 220) : "";
          const displayName = post.authorName || "Unknown";
          const createdAtText = formatDate(post.createdAt);

          const avatarUrl =
            post.authorAvatarUrl ||
            (post.authorEmail
              ? `https://api.dicebear.com/7.x/bottts/png?seed=${encodeURIComponent(
                  post.authorEmail
                )}`
              : "");

          const thumbUrl = post.imageUrl
            ? getOptimizedImageUrl(post.imageUrl, { width: 520 })
            : "";

          const likedBy = Array.isArray(post.likedBy) ? post.likedBy : [];
          const isLiked = currentUser
            ? likedBy.includes(currentUser.uid)
            : false;
          const likesCount =
            typeof post.likesCount === "number" ? post.likesCount : 0;

          return (
            <article
              key={post.id}
              className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/90 shadow-[0_14px_32px_rgba(15,23,42,0.9)] hover:shadow-[0_20px_40px_rgba(15,23,42,0.95)] transition-transform duration-300 hover:-translate-y-1"
            >
              <div className="p-4 sm:p-5 flex flex-col gap-3">
                {/* header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {avatarUrl && (
                      <Link
                        to={`/u/${post.authorId}`}
                        className="relative h-10 w-10 rounded-full overflow-hidden border border-emerald-400/60 bg-slate-900 flex-shrink-0"
                      >
                        <img
                          src={avatarUrl}
                          alt={displayName}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      </Link>
                    )}
                    <div className="flex flex-col">
                      <Link
                        to={`/u/${post.authorId}`}
                        className="text-sm font-semibold text-slate-50 hover:text-emerald-300 hover:underline"
                      >
                        {displayName}
                      </Link>
                      <span className="text-[11px] text-slate-400">
                        {createdAtText}
                      </span>
                    </div>
                  </div>

                  {post.imageUrl && (
                    <Link
                      to={`/post/${post.slug}`}
                      className="hidden sm:block h-16 w-24 rounded-xl overflow-hidden border border-slate-700 bg-slate-900 flex-shrink-0"
                    >
                      <img
                        src={thumbUrl}
                        alt={post.title}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    </Link>
                  )}
                </div>

                {/* title */}
                <Link
                  to={`/post/${post.slug}`}
                  className="inline-block text-base sm:text-lg font-semibold text-slate-50 tracking-tight hover:text-emerald-300 transition-colors duration-200 line-clamp-2"
                >
                  {post.title}
                </Link>

                {/* content preview */}
                <div className="text-sm text-slate-200 line-clamp-3 prose prose-invert max-w-none">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      a: ({ node, href = "", ...props }) => {
                        const isExternal =
                          href.startsWith("http://") ||
                          href.startsWith("https://") ||
                          href.startsWith("www.");
                        if (isExternal) {
                          return (
                            <a
                              href={href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-emerald-300 underline underline-offset-2 hover:text-emerald-200"
                              {...props}
                            />
                          );
                        }
                        return (
                          <a
                            href={href}
                            className="text-emerald-300 underline underline-offset-2 hover:text-emerald-200"
                            {...props}
                          />
                        );
                      },
                    }}
                  >
                    {previewContent}
                  </ReactMarkdown>
                </div>

                {/* footer */}
                <div className="mt-2 pt-2 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      disabled={!currentUser || likeLoading[post.id]}
                      onClick={() => handleToggleLike(post)}
                      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-medium transition-all ${
                        isLiked
                          ? "bg-rose-500 text-white shadow-md shadow-rose-500/40"
                          : "bg-slate-800 text-slate-100 hover:bg-slate-700"
                      } disabled:opacity-60`}
                    >
                      <Heart
                        className={`h-3.5 w-3.5 ${
                          isLiked ? "fill-current" : "text-rose-300"
                        }`}
                      />
                      <span>{likesCount}</span>
                    </button>

                    {currentUser?.uid === post.authorId ? (
                      <Link
                        to={`/edit/${post.id}`}
                        className="px-3 py-1.5 rounded-full bg-slate-800 text-slate-100 hover:bg-slate-700"
                      >
                        Edit story
                      </Link>
                    ) : (
                      <span className="text-[11px] text-slate-500">
                        Published on BharatBlog
                      </span>
                    )}
                  </div>

                  <Link
                    to={`/post/${post.slug}`}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-500/60 text-[11px] font-medium text-emerald-200 hover:bg-emerald-500/10 transition-all self-start sm:self-auto"
                  >
                    <span>Open full story</span>
                    <span className="text-emerald-300">↗</span>
                  </Link>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {hasMore && (
        <div className="mt-8 flex justify-center">
          <button
            onClick={() => fetchPosts(true)}
            disabled={loadingMore}
            className="px-4 py-2 rounded-full bg-slate-900 border border-slate-700 text-slate-100 text-xs sm:text-sm font-medium hover:bg-slate-800 disabled:opacity-60"
          >
            {loadingMore ? "Loading more stories..." : "Load more stories"}
          </button>
        </div>
      )}
    </div>
  );
}
