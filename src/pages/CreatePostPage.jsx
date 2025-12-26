import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";

function slugify(title) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export default function CreatePostPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!currentUser) {
      setError("You must be logged in.");
      return;
    }

    if (!title.trim() || !content.trim()) {
      setError("Title and content are required.");
      return;
    }

    try {
      setSubmitting(true);

      const baseSlug = slugify(title);
      const randomSuffix = Math.random().toString(36).slice(2, 7);
      const slug = `${baseSlug}-${randomSuffix}`;

      await addDoc(collection(db, "posts"), {
        title: title.trim(),
        slug,
        content: content.trim(),
        imageUrl: "", // later filled by Cloudinary
        authorId: currentUser.uid,
        authorName: currentUser.displayName || "Unknown",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      navigate("/");
    } catch (err) {
      console.error(err);
      setError("Failed to create post. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold text-white mb-4">Create new post</h1>

      {error && (
        <div className="mb-3 text-sm text-red-400 bg-red-950/40 border border-red-500/40 px-3 py-2 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-slate-200 mb-1">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded border border-slate-600 bg-slate-900 px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="Post title"
          />
        </div>

        <div>
          <label className="block text-sm text-slate-200 mb-1">Content</label>
          <textarea
            rows={8}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full rounded border border-slate-600 bg-slate-900 px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="Write your post content here..."
          />
          <p className="mt-1 text-xs text-slate-400">
            For now this is plain text; later you can upgrade to markdown or a rich text editor.
          </p>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center justify-center px-4 py-2 rounded-md bg-emerald-500 text-white font-medium hover:bg-emerald-600 disabled:opacity-60"
        >
          {submitting ? "Publishing..." : "Publish post"}
        </button>
      </form>
    </div>
  );
}
