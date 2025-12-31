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

const PAGE_SIZE = 5;

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
      // reload page data to be safe
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
            Loading your BharatBlog feed...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-6 sm:py-8 px-4 sm:px-0">
      {/* Header row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-50 tracking-tight">
            Your BharatBlog feed
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-md">
            Thoughts, stories and ideas from the people you follow.
          </p>
        </div>

        <Link
          to="/create"
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 text-xs sm:text-sm text-white font-medium shadow-md shadow-orange-500/30 hover:shadow-orange-500/50 hover:scale-105 transition-transform"
        >
          <span className="text-base leading-none">+</span>
          <span>New post</span>
        </Link>
      </div>

      {error && (
        <div className="mb-4 text-sm text-red-400 bg-red-950/40 border border-red-500/40 px-3 py-2 rounded-lg">
          {error}
        </div>
      )}

      {posts.length === 0 && !loading && (
        <div className="mt-10 rounded-2xl border border-dashed border-slate-700/70 bg-slate-900/60 px-6 py-10 text-center">
          <p className="text-slate-200 text-base font-medium mb-1">
            No posts in your feed yet.
          </p>
          <p className="text-slate-400 text-sm mb-4">
            Be the first to share something on BharatBlog.
          </p>
          <Link
            to="/create"
            className="inline-flex items-center justify-center px-4 py-2 rounded-full bg-emerald-500 text-white text-xs sm:text-sm font-medium hover:bg-emerald-600"
          >
            Start writing
          </Link>
        </div>
      )}

      {/* Posts list */}
      <div className="space-y-4 sm:space-y-5">
        {posts.map((post) => {
          const previewContent = post.content ? post.content.slice(0, 200) : "";
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
            ? getOptimizedImageUrl(post.imageUrl, { width: 400 })
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
              className="relative overflow-hidden rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500/50 transition-colors shadow-sm shadow-black/30"
            >
              {/* subtle top border accent */}
              <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-orange-500 via-emerald-500 to-sky-500 opacity-60" />

              <div className="p-4 sm:p-5 flex flex-col sm:flex-row gap-4">
                {post.imageUrl && (
                  <Link
                    to={`/post/${post.slug}`}
                    className="hidden sm:block h-24 w-32 rounded-xl overflow-hidden border border-slate-700 flex-shrink-0"
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
                  {/* author row */}
                 <div className="flex items-center gap-3 mb-2">
  {avatarUrl && (
    <Link
      to={`/u/${post.authorId}`}
      className="h-8 w-8 rounded-full overflow-hidden border border-slate-600 bg-slate-800 flex-shrink-0"
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
      className="text-xs font-semibold text-slate-100 hover:text-emerald-300 hover:underline"
    >
      {displayName}
    </Link>
    <span className="text-[11px] text-slate-400">
      {createdAtText}
    </span>
  </div>
</div>


                  {/* title */}
                  <Link
                    to={`/post/${post.slug}`}
                    className="inline-block text-base sm:text-lg font-semibold text-emerald-400 hover:text-emerald-300 hover:underline line-clamp-2"
                  >
                    {post.title}
                  </Link>

                  {/* content preview */}
                  <div className="mt-2 text-sm text-slate-200 line-clamp-3 prose prose-invert max-w-none">
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
                                className="text-emerald-400 underline hover:text-emerald-300"
                                {...props}
                              />
                            );
                          }

                          return (
                            <a
                              href={href}
                              className="text-emerald-400 underline hover:text-emerald-300"
                              {...props}
                            />
                          );
                        },
                      }}
                    >
                      {previewContent}
                    </ReactMarkdown>
                  </div>

                  {/* edit + read more row + like */}
                  <div className="mt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs">
                    <div className="flex items-center gap-3">
                      {/* LIKE BUTTON */}
                      <button
                        type="button"
                        disabled={!currentUser || likeLoading[post.id]}
                        onClick={() => handleToggleLike(post)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] ${
                          isLiked
                            ? "bg-rose-500/10 border-rose-500/40 text-rose-300"
                            : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
                        } disabled:opacity-60`}
                      >
                        <Heart
                          className={`h-3.5 w-3.5 ${
                            isLiked
                              ? "fill-rose-500 text-rose-400"
                              : "text-slate-300"
                          }`}
                        />
                        <span>{likesCount}</span>
                      </button>

                      {currentUser?.uid === post.authorId ? (
                        <div className="flex gap-2">
                          <Link
                            to={`/edit/${post.id}`}
                            className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-100"
                          >
                            Edit post
                          </Link>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-500">
                          Posted on BharatBlog
                        </span>
                      )}
                    </div>

                    <Link
                      to={`/post/${post.slug}`}
                      className="text-[11px] font-medium text-emerald-400 hover:text-emerald-300 self-start sm:self-auto"
                    >
                      Read full post →
                    </Link>
                  </div>
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
            className="px-4 py-2 rounded-full bg-slate-800 text-slate-100 text-xs sm:text-sm font-medium hover:bg-slate-700 disabled:opacity-60"
          >
            {loadingMore ? "Loading..." : "Load more posts"}
          </button>
        </div>
      )}
    </div>
  );
}
