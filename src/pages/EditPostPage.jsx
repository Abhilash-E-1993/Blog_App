// src/pages/EditPostPage.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import MDEditor from "@uiw/react-md-editor";
import { uploadImageToCloudinary } from "../lib/cloudinary";

export default function EditPostPage() {
  const { id } = useParams();            // this is Firestore doc id
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [postAuthorId, setPostAuthorId] = useState("");
  const [currentImageUrl, setCurrentImageUrl] = useState("");
  const [slug, setSlug] = useState("");  // NEW: store slug so we can navigate back correctly

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
        setSlug(data.slug || "");  // capture slug from Firestore
      } catch (err) {
        console.error(err);
        setError("Failed to load post.");
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!currentUser) {
      setError("You must be logged in.");
      return;
    }

    if (currentUser.uid !== postAuthorId) {
      setError("You are not allowed to edit this post.");
      return;
    }

    if (!title.trim() || !content.trim()) {
      setError("Title and content are required.");
      return;
    }

    try {
      setSaving(true);
      const ref = doc(db, "posts", id);

      const updatedData = {
        title: title.trim(),
        content: content,
        updatedAt: serverTimestamp(),
      };

      if (newImageUrl) {
        updatedData.imageUrl = newImageUrl;
      }

      await updateDoc(ref, updatedData);

      // IMPORTANT: navigate back using slug route, not id
      if (slug) {
        navigate(`/post/${slug}`);
      } else {
        // fallback: go home if slug missing for some reason
        navigate("/");
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
      <div className="flex justify-center mt-10">
        <p className="text-slate-300">Loading post...</p>
      </div>
    );
  }

  if (notFound) {
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
    <div className="max-w-3xl mx-auto" data-color-mode="dark">
      <h1 className="text-2xl font-semibold text-white mb-4">
        Edit post
      </h1>

      {error && (
        <div className="mb-3 text-sm text-red-400 bg-red-950/40 border border-red-500/40 px-3 py-2 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title */}
        <div>
          <label className="block text-sm text-slate-200 mb-1">
            Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded border border-slate-600 bg-slate-900 px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Current image + new upload */}
        <div>
          <label className="block text-sm text-slate-200 mb-1">
            Image (optional)
          </label>

          {currentImageUrl && !newImageUrl && (
            <div className="mb-2">
              <p className="text-xs text-slate-400 mb-1">
                Current image:
              </p>
              <img
                src={currentImageUrl}
                alt="Current"
                className="h-40 w-auto rounded border border-slate-700 object-cover"
              />
            </div>
          )}

          {newImageUrl && (
            <div className="mb-2">
              <p className="text-xs text-slate-400 mb-1">
                New image uploaded:
              </p>
              <img
                src={newImageUrl}
                alt="New"
                className="h-40 w-auto rounded border border-slate-700 object-cover"
              />
            </div>
          )}

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="text-sm text-slate-200"
            />
            <button
              type="button"
              onClick={handleUploadImage}
              disabled={!imageFile || uploadingImage}
              className="inline-flex items-center justify-center px-3 py-1.5 rounded-md bg-slate-700 text-slate-100 text-xs font-medium hover:bg-slate-600 disabled:opacity-60"
            >
              {uploadingImage ? "Uploading..." : "Upload new image"}
            </button>
          </div>

          {imagePreview && !newImageUrl && (
            <div className="mt-2">
              <p className="text-xs text-slate-400 mb-1">
                Preview (local file):
              </p>
              <img
                src={imagePreview}
                alt="Preview"
                className="h-40 w-auto rounded border border-slate-700 object-cover"
              />
            </div>
          )}
        </div>

        {/* Markdown editor */}
        <div>
          <label className="block text-sm text-slate-200 mb-1">
            Content (Markdown)
          </label>
          <div className="border border-slate-600 rounded bg-slate-900">
            <MDEditor
              value={content}
              onChange={(val) => setContent(val || "")}
              height={300}
            />
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center px-4 py-2 rounded-md bg-emerald-500 text-white font-medium hover:bg-emerald-600 disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save changes"}
          </button>
          <Link
            to="/"
            className="inline-flex items-center justify-center px-4 py-2 rounded-md bg-slate-700 text-slate-100 text-sm hover:bg-slate-600"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
