// src/pages/PostPage.jsx
import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  collection,
  getDocs,
  query,
  where,
  limit,
  doc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getOptimizedImageUrl } from "../lib/cloudinary";
import { togglePostLike } from "../lib/likes";
import { Heart } from "lucide-react";

export default function PostPage() {
  const { slug } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [likeLoading, setLikeLoading] = useState(false);

  useEffect(() => {
    const fetchPost = async () => {
      if (!slug) {
        setPost(null);
        setLoading(false);
        return;
      }

      try {
        const q = query(
          collection(db, "posts"),
          where("slug", "==", slug),
          limit(1)
        );

        const snap = await getDocs(q);

        if (snap.empty) {
          setPost(null);
        } else {
          const docSnap = snap.docs[0];
          setPost({ id: docSnap.id, ...docSnap.data() });
        }
      } catch (err) {
        console.error(err);
        setError("Failed to load post.");
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [slug]);

  const formatDate = (ts) => {
    if (!ts) return "";
    try {
      const date = ts.toDate ? ts.toDate() : ts;
      return date instanceof Date ? date.toLocaleString() : "";
    } catch {
      return "";
    }
  };

  const handleDelete = async () => {
    if (!post || !currentUser) return;

    const confirmDelete = window.confirm("Delete this post permanently?");
    if (!confirmDelete) return;

    try {
      setDeleting(true);
      await deleteDoc(doc(db, "posts", post.id));
      navigate("/feed");
    } catch (err) {
      console.error(err);
      setError("Failed to delete post.");
      setDeleting(false);
    }
  };

  const handleToggleLike = async () => {
    if (!currentUser || !post) return;

    const userId = currentUser.uid;
    const postId = post.id;

    // optimistic update
    setPost((prev) => {
      if (!prev) return prev;
      const likedBy = Array.isArray(prev.likedBy) ? prev.likedBy : [];
      const hasLiked = likedBy.includes(userId);
      const newLikedBy = hasLiked
        ? likedBy.filter((id) => id !== userId)
        : [...likedBy, userId];
      const likesCount =
        typeof prev.likesCount === "number" ? prev.likesCount : 0;
      return {
        ...prev,
        likedBy: newLikedBy,
        likesCount: likesCount + (hasLiked ? -1 : 1),
      };
    });

    setLikeLoading(true);
    try {
      await togglePostLike(postId, userId);
    } catch (err) {
      console.error(err);
      setError("Failed to update like. Please try again.");
      // optionally you could re-fetch the post here
    } finally {
      setLikeLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-emerald-500/70 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-300 text-sm">Loading post...</p>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="max-w-3xl mx-auto py-8">
        <div className="rounded-2xl border border-dashed border-slate-700/80 bg-slate-900/70 px-6 py-8">
          <p className="text-slate-200 text-base font-medium mb-2">
            This BharatBlog post could not be found.
          </p>
          <p className="text-slate-400 text-sm mb-4">
            It may have been deleted or the link might be incorrect.
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

  const heroUrl = post.imageUrl
    ? getOptimizedImageUrl(post.imageUrl, { width: 1200 })
    : "";

  const likedBy = Array.isArray(post.likedBy) ? post.likedBy : [];
  const isLiked = currentUser ? likedBy.includes(currentUser.uid) : false;
  const likesCount =
    typeof post.likesCount === "number" ? post.likesCount : 0;

  return (
    <div className="max-w-3xl mx-auto py-4">
      {error && (
        <div className="mb-3 text-sm text-red-400 bg-red-950/40 border border-red-500/40 px-3 py-2 rounded-lg">
          {error}
        </div>
      )}

      {/* Title + meta card */}
      <div className="mb-5 rounded-2xl border border-slate-800 bg-slate-950/90 p-4 sm:p-5 shadow-md shadow-black/40">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-50 tracking-tight mb-2">
          {post.title}
        </h1>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] sm:text-xs text-slate-400">
          <span>
  By{" "}
  <Link
    to={`/u/${post.authorId}`}
    className="font-medium text-slate-200 hover:text-emerald-300 hover:underline"
  >
    {post.authorName || "Unknown"}
  </Link>
</span>

          <span className="h-1 w-1 rounded-full bg-slate-600" />
          <span>{formatDate(post.createdAt)}</span>
          {post.updatedAt && (
            <>
              <span className="h-1 w-1 rounded-full bg-slate-600" />
              <span className="italic">
                updated {formatDate(post.updatedAt)}
              </span>
            </>
          )}
        </div>

        {/* Like button under meta */}
        <div className="mt-3 flex items-center gap-3">
          <button
            type="button"
            disabled={!currentUser || likeLoading}
            onClick={handleToggleLike}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs ${
              isLiked
                ? "bg-rose-500/10 border-rose-500/40 text-rose-300"
                : "bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800"
            } disabled:opacity-60`}
          >
            <Heart
              className={`h-4 w-4 ${
                isLiked ? "fill-rose-500 text-rose-400" : "text-slate-300"
              }`}
            />
            <span>
              {likesCount} like{likesCount === 1 ? "" : "s"}
            </span>
          </button>
        </div>
      </div>

      {/* Image */}
      {post.imageUrl && (
        <div className="mb-5 overflow-hidden rounded-2xl border border-slate-800 bg-slate-950">
          <img
            src={heroUrl}
            alt={post.title}
            className="w-full max-h-[420px] object-cover"
          />
        </div>
      )}

      {/* Content */}
      <div className="rounded-2xl bg-slate-950/90 border border-slate-800 p-4 sm:p-5 shadow-md shadow-black/40">
        <div className="prose prose-invert max-w-none text-slate-100 prose-a:text-emerald-400 prose-a:underline hover:prose-a:text-emerald-300">
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
            {post.content || ""}
          </ReactMarkdown>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Link
          to="/feed"
          className="text-sm text-emerald-400 hover:text-emerald-300"
        >
          ← Back to feed
        </Link>

        {currentUser?.uid === post.authorId && (
          <div className="flex flex-wrap items-center gap-2">
            <Link
              to={`/edit/${post.id}`}
              className="px-3 py-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-medium border border-slate-700/80"
            >
              Edit post
            </Link>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="px-3 py-1.5 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-medium disabled:opacity-60"
            >
              {deleting ? "Deleting..." : "Delete"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
