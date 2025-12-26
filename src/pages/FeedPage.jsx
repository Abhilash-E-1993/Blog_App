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

const PAGE_SIZE = 5;

export default function FeedPage() {
  const { currentUser } = useAuth();
  const [posts, setPosts] = useState([]);
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");

  const fetchPosts = async (isLoadMore = false) => {
    try {
      if (!currentUser) return;

      if (!isLoadMore) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      let q = query(
        collection(db, "posts"),
        orderBy("createdAt", "desc"),
        limit(PAGE_SIZE)
      );

      if (isLoadMore && lastDoc) {
        q = query(
          collection(db, "posts"),
          orderBy("createdAt", "desc"),
          startAfter(lastDoc),
          limit(PAGE_SIZE)
        );
      }

      const snap = await getDocs(q);

      if (!snap.empty) {
        const newPosts = snap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setPosts((prev) =>
          isLoadMore ? [...prev, ...newPosts] : newPosts
        );
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

  if (loading && posts.length === 0) {
    return (
      <div className="flex justify-center mt-10">
        <p className="text-slate-300">Loading posts...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold text-white">Feed</h1>
        <Link
          to="/create"
          className="inline-flex items-center px-3 py-1.5 rounded-md bg-emerald-500 text-sm text-white font-medium hover:bg-emerald-600"
        >
          + New post
        </Link>
      </div>

      {error && (
        <div className="mb-3 text-sm text-red-400 bg-red-950/40 border border-red-500/40 px-3 py-2 rounded">
          {error}
        </div>
      )}

      {posts.length === 0 && !loading && (
        <p className="text-slate-300">No posts yet. Be the first to write one!</p>
      )}

      <div className="space-y-4">
        {posts.map((post) => (
          <article
            key={post.id}
            className="bg-slate-800 border border-slate-700 rounded-lg p-4"
          >
            <Link
              to={`/post/${post.slug}`}
              className="text-lg font-semibold text-emerald-400 hover:underline"
            >
              {post.title}
            </Link>
            <div className="mt-1 text-xs text-slate-400">
              By {post.authorName || "Unknown"} · {formatDate(post.createdAt)}
            </div>
            <p className="mt-2 text-sm text-slate-200 line-clamp-3">
              {post.content}
            </p>
            {currentUser?.uid === post.authorId && (
              <div className="mt-3 flex gap-2 text-xs">
                <Link
                  to={`/edit/${post.id}`}
                  className="px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-100"
                >
                  Edit
                </Link>
              </div>
            )}
          </article>
        ))}
      </div>

      {hasMore && (
        <div className="mt-6 flex justify-center">
          <button
            onClick={() => fetchPosts(true)}
            disabled={loadingMore}
            className="px-4 py-2 rounded-md bg-slate-700 text-slate-100 text-sm font-medium hover:bg-slate-600 disabled:opacity-60"
          >
            {loadingMore ? "Loading..." : "Load more"}
          </button>
        </div>
      )}
    </div>
  );
}
