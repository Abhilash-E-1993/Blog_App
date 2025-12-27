// src/pages/CreatePostPage.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  getDoc,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import MDEditor from "@uiw/react-md-editor";
import { uploadImageToCloudinary } from "../lib/cloudinary";

function slugify(title) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

function normalizeUrl(url) {
  if (!url) return "";
  const trimmed = url.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

export default function CreatePostPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState(
    "Write your post here in **Markdown**."
  );
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageUrl, setImageUrl] = useState("");

  const [rawLinkLabel, setRawLinkLabel] = useState("");
  const [rawLinkUrl, setRawLinkUrl] = useState("");

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
      setImageUrl(url);
    } catch (err) {
      console.error(err);
      setError(err.message || "Image upload failed.");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleInsertLink = () => {
    setError("");
    if (!rawLinkUrl.trim()) {
      setError("Please enter a link URL.");
      return;
    }
    const fullUrl = normalizeUrl(rawLinkUrl);
    const label = rawLinkLabel.trim() || fullUrl;
    const markdownLink = `[${label}](${fullUrl})`;

    setContent((prev) => (prev ? `${prev}\n\n${markdownLink}` : markdownLink));
    setRawLinkLabel("");
    setRawLinkUrl("");
  };

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

      // 1) Resolve authorName from users collection or email
      let authorName = "";
      try {
        const userRef = doc(db, "users", currentUser.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          authorName = userSnap.data().name || "";
        }
      } catch (e) {
        console.warn("Could not read user profile for name:", e);
      }

      if (!authorName) {
        authorName =
          currentUser.displayName ||
          (currentUser.email
            ? currentUser.email.split("@")[0]
            : "Unknown");
      }

      // 2) Build slug
      const baseSlug = slugify(title);
      const randomSuffix = Math.random().toString(36).slice(2, 7);
      const slug = `${baseSlug}-${randomSuffix}`;

      // 3) Save post
      await addDoc(collection(db, "posts"), {
        title: title.trim(),
        slug,
        content: content,
        imageUrl: imageUrl || "",
        authorId: currentUser.uid,
        authorName, // always a real name now
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
    <div className="max-w-3xl mx-auto" data-color-mode="dark">
      <h1 className="text-2xl font-semibold text-white mb-4">
        Create new post
      </h1>

      {error && (
        <div className="mb-3 text-sm text-red-400 bg-red-950/40 border border-red-500/40 px-3 py-2 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title */}
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

        {/* Image upload */}
        <div>
          <label className="block text-sm text-slate-200 mb-1">
            Image (one per post)
          </label>
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
              {uploadingImage ? "Uploading..." : "Upload image"}
            </button>
          </div>

          {imagePreview && (
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

          {imageUrl && (
            <p className="mt-1 text-xs text-emerald-400">
              Image uploaded successfully.
            </p>
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
          <p className="mt-1 text-xs text-slate-400">
            Supports headings, **bold**, _italic_, lists, links, tables, etc.
          </p>
        </div>

        {/* Quick link inserter */}
        <div className="border border-slate-700 rounded-md p-3 bg-slate-900/60 space-y-2">
          <p className="text-xs text-slate-300">
            Quick link (no need to type https):
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={rawLinkLabel}
              onChange={(e) => setRawLinkLabel(e.target.value)}
              placeholder="Link text (e.g. Google)"
              className="flex-1 rounded border border-slate-600 bg-slate-900 px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
            <input
              type="text"
              value={rawLinkUrl}
              onChange={(e) => setRawLinkUrl(e.target.value)}
              placeholder="google.com"
              className="flex-1 rounded border border-slate-600 bg-slate-900 px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
            <button
              type="button"
              onClick={handleInsertLink}
              className="px-3 py-1.5 rounded bg-slate-700 text-slate-100 text-xs font-medium hover:bg-slate-600"
            >
              Insert link
            </button>
          </div>
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
