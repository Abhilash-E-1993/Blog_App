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

export default function PostPage() {
  const { slug } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchPost = async () => {
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
    const date = ts.toDate ? ts.toDate() : ts;
    return date.toLocaleString();
  };

  const handleDelete = async () => {
    if (!post || !currentUser) return;

    const confirmDelete = window.confirm("Delete this post permanently?");
    if (!confirmDelete) return;

    try {
      setDeleting(true);
      await deleteDoc(doc(db, "posts", post.id));
      navigate("/");
    } catch (err) {
      console.error(err);
      setError("Failed to delete post.");
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center mt-10">
        <p className="text-slate-300">Loading post...</p>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="max-w-3xl mx-auto">
        <p className="text-slate-300">Post not found.</p>
        <Link
          to="/"
          className="mt-4 inline-block text-emerald-400 hover:underline text-sm"
        >
          ← Back to feed
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {error && (
        <div className="mb-3 text-sm text-red-400 bg-red-950/40 border border-red-500/40 px-3 py-2 rounded">
          {error}
        </div>
      )}

      <h1 className="text-3xl font-semibold text-white mb-2">
        {post.title}
      </h1>

      <div className="text-xs text-slate-400 mb-4">
        By {post.authorName || "Unknown"} ·{" "}
        {formatDate(post.createdAt)}{" "}
        {post.updatedAt && (
          <span className="italic">
            (updated {formatDate(post.updatedAt)})
          </span>
        )}
      </div>

      {post.imageUrl && (
        <div className="mb-4">
          <img
            src={post.imageUrl}
            alt={post.title}
            className="w-full max-h-100 object-cover rounded border border-slate-700"
          />
        </div>
      )}

      <div className="prose prose-invert max-w-none text-slate-100">
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

      <div className="mt-6 flex items-center gap-3">
        <Link
          to="/"
          className="text-sm text-emerald-400 hover:underline"
        >
          ← Back to feed
        </Link>

        {currentUser?.uid === post.authorId && (
          <>
            <Link
              to={`/edit/${post.id}`}
              className="px-3 py-1.5 rounded bg-slate-700 hover:bg-slate-600 text-slate-100 text-xs font-medium"
            >
              Edit
            </Link>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="px-3 py-1.5 rounded bg-red-600 hover:bg-red-700 text-white text-xs font-medium disabled:opacity-60"
            >
              {deleting ? "Deleting..." : "Delete"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
