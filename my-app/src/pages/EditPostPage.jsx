// src/pages/EditPostPage.jsx
import { useEffect, useState, lazy, Suspense, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import { uploadImageToCloudinary } from "../lib/cloudinary";

// Lazy‑load heavy markdown editor to reduce initial bundle size
const MDEditor = lazy(() => import("@uiw/react-md-editor"));

export default function EditPostPage() {
  const { id } = useParams(); // Firestore doc id
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [postAuthorId, setPostAuthorId] = useState("");
  const [currentImageUrl, setCurrentImageUrl] = useState("");
  const [slug, setSlug] = useState("");

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [newImageUrl, setNewImageUrl] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const loadPost = async () => {
      try {
        const ref = doc(db, "posts", id);
        const snap = await getDoc(ref);

        if (!snap.exists()) {
          setNotFound(true);
          return;
        }

        const data = snap.data();
        setTitle(data.title || "");
        setContent(data.content || "");
        setPostAuthorId(data.authorId || "");
        setCurrentImageUrl(data.imageUrl || "");
        setSlug(data.slug || "");
      } catch (err) {
        console.error(err);
        setError("Failed to load story.");
      } finally {
        setLoading(false);
      }
    };

    loadPost();
  }, [id]);

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleUploadImage = async () => {
    setError("");
    if (!imageFile) {
      setError("Please select an image first.");
      return;
    }
    try {
      setUploadingImage(true);
      const url = await uploadImageToCloudinary(imageFile);
      setNewImageUrl(url);
    } catch (err) {
      console.error(err);
      setError(err.message || "Image upload failed.");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleEditorChange = useCallback((val) => {
    setContent(val || "");
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!currentUser) {
      setError("You must be logged in.");
      return;
    }

    if (currentUser.uid !== postAuthorId) {
      setError("You are not allowed to edit this story.");
      return;
    }

    if (!title.trim() || !content.trim()) {
      setError("Title and story content are required.");
      return;
    }

    try {
      setSaving(true);
      const ref = doc(db, "posts", id);

      const updatedData = {
        title: title.trim(),
        content,
        updatedAt: serverTimestamp(),
      };

      if (newImageUrl) {
        updatedData.imageUrl = newImageUrl;
      }

      await updateDoc(ref, updatedData);

      if (slug) {
        navigate(`/post/${slug}`);
      } else {
        navigate("/feed");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to save changes.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-emerald-500/70 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-300 text-sm">Loading story...</p>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="max-w-3xl mx-auto py-8">
        <div className="rounded-2xl border border-dashed border-slate-700/80 bg-slate-900/70 px-6 py-8">
          <p className="text-slate-200 text-base font-medium mb-2">
            This BharatBlog story could not be found.
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

  return (
    <div className="max-w-3xl mx-auto py-4" data-color-mode="dark">
      {/* Header */}
      <div className="mb-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 mb-3">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          <span className="text-[11px] font-semibold tracking-[0.2em] uppercase text-emerald-300">
            Edit BharatBlog story
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-50 tracking-tight">
          Edit story
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Refine your title, cover image, or writing before updating your story.
        </p>
      </div>

      {error && (
        <div className="mb-4 text-sm text-red-400 bg-red-950/40 border border-red-500/40 px-3 py-2 rounded-lg">
          {error}
        </div>
      )}

      {/* Card */}
      <div className="relative">
        <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/15 via-sky-500/10 to-emerald-500/15 rounded-3xl blur-xl opacity-60" />
        <div className="relative rounded-3xl border border-slate-800 bg-slate-950/90 backdrop-blur-xl p-4 sm:p-6 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm text-slate-200 mb-1">
                Story title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-xl border-2 border-slate-700 bg-slate-900/80 px-3 py-2.5 text-sm sm:text-base text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="Update your story title"
              />
            </div>

            {/* Image section */}
            <div className="space-y-3">
              <label className="block text-sm text-slate-200">
                Cover image <span className="text-slate-500 text-xs">(optional)</span>
              </label>

              {/* Current image */}
              {currentImageUrl && !newImageUrl && (
                <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-3">
                  <p className="text-xs text-slate-400 mb-1">
                    Current cover:
                  </p>
                  <img
                    src={currentImageUrl}
                    alt="Current cover"
                    className="h-40 w-full max-w-md rounded-xl border border-slate-700 object-cover"
                  />
                </div>
              )}

              {/* New uploaded image */}
              {newImageUrl && (
                <div className="rounded-2xl border border-emerald-600/60 bg-slate-900/80 p-3">
                  <p className="text-xs text-emerald-300 mb-1">
                    New cover attached:
                  </p>
                  <img
                    src={newImageUrl}
                    alt="New cover"
                    className="h-40 w-full max-w-md rounded-xl border border-emerald-500/60 object-cover"
                  />
                </div>
              )}

              {/* Controls */}
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <label className="inline-flex items-center justify-center px-4 py-2 rounded-full bg-slate-800 text-slate-100 text-xs sm:text-sm font-medium cursor-pointer hover:bg-slate-700 border border-slate-600">
                  Choose image
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>

                {imageFile && (
                  <span className="text-xs sm:text-sm text-slate-300 truncate max-w-[180px]">
                    {imageFile.name}
                  </span>
                )}

                <button
                  type="button"
                  onClick={handleUploadImage}
                  disabled={!imageFile || uploadingImage}
                  className="inline-flex items-center justify-center px-4 py-2 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 text-white text-xs sm:text-sm font-semibold shadow-md shadow-orange-500/30 hover:shadow-orange-500/50 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 transition-all duration-200"
                >
                  {uploadingImage ? "Uploading..." : "Upload new cover"}
                </button>
              </div>

              {/* Local preview */}
              {imagePreview && !newImageUrl && (
                <div className="mt-2 flex flex-col sm:flex-row gap-3 sm:items-center">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="h-32 w-48 rounded-xl border border-slate-700 object-cover"
                  />
                  <p className="text-xs text-slate-400">
                    This is a local preview. Click “Upload new cover” to update the image on your story.
                  </p>
                </div>
              )}
            </div>

            {/* Markdown editor (lazy‑loaded) */}
            <div>
              <label className="block text-sm text-slate-200 mb-1">
                Story content (Markdown)
              </label>
              <div className="border border-slate-700 rounded-2xl bg-slate-900/80 overflow-hidden">
                <Suspense
                  fallback={
                    <textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="Loading editor... you can start adjusting your story here."
                      className="w-full min-h-[200px] bg-slate-900/80 text-sm text-slate-100 px-3 py-2 border-0 focus:outline-none"
                    />
                  }
                >
                  <MDEditor
                    value={content}
                    onChange={handleEditorChange}
                    height={320}
                  />
                </Suspense>
              </div>
              <p className="mt-1 text-xs text-slate-400">
                Improve your story text and formatting here. Everything supports Markdown.
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center px-5 py-2.5 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-sm font-semibold hover:shadow-lg hover:shadow-emerald-500/30 disabled:opacity-60 transition-all"
              >
                {saving ? "Saving..." : "Save story"}
              </button>
              <Link
                to={slug ? `/post/${slug}` : "/feed"}
                className="inline-flex items-center justify-center px-4 py-2 rounded-full bg-slate-800 text-slate-100 text-sm hover:bg-slate-700 border border-slate-700/80"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
