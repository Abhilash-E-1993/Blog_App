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
  const { currentUser, profile } = useAuth();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
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

      const baseSlug = slugify(title);
      const randomSuffix = Math.random().toString(36).slice(2, 7);
      const slug = `${baseSlug}-${randomSuffix}`;

      const authorEmail = profile?.email || currentUser.email || "";
      const authorAvatarUrl = profile?.avatarUrl || "";


      await addDoc(collection(db, "posts"), {
  title: title.trim(),
  slug,
  content,
  imageUrl: imageUrl || "",
  authorId: currentUser.uid,
  authorName,
  authorEmail,
  authorAvatarUrl,
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),

  // NEW FIELDS FOR LIKES
  likesCount: 0,
  likedBy: [],
});


      navigate("/feed");
    } catch (err) {
      console.error(err);
      setError("Failed to create post. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-4" data-color-mode="dark">
      {/* Header */}
      <div className="mb-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/40 bg-orange-500/10 px-3 py-1 mb-3">
          <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
          <span className="text-[11px] font-semibold tracking-[0.2em] uppercase text-orange-300">
            Write on BharatBlog
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-50 tracking-tight">
          Create a new post
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Share your thoughts, stories, and ideas with the BharatBlog community.
        </p>
      </div>

      {error && (
        <div className="mb-4 text-sm text-red-400 bg-red-950/40 border border-red-500/50 px-3 py-2 rounded-lg">
          {error}
        </div>
      )}

      {/* Main card */}
      <div className="relative">
        <div className="absolute -inset-1 bg-gradient-to-r from-orange-500/15 via-emerald-500/15 to-sky-500/15 rounded-3xl blur-xl opacity-60" />
        <div className="relative rounded-3xl border border-slate-800 bg-slate-950/90 backdrop-blur-xl p-4 sm:p-6 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm text-slate-200 mb-1">
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-xl border-2 border-slate-700 bg-slate-900/80 px-3 py-2.5 text-sm sm:text-base text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="Give your post a clear, strong title"
              />
            </div>
{/* Image upload */}
<div className="space-y-2">
  <label className="block text-sm text-slate-200">
    Cover image <span className="text-slate-500 text-xs">(optional)</span>
  </label>

  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
    {/* Styled "Choose file" */}
    <label className="inline-flex items-center justify-center px-4 py-2 rounded-full bg-slate-800 text-slate-100 text-xs sm:text-sm font-medium cursor-pointer hover:bg-slate-700 border border-slate-600">
      Choose image
      <input
        type="file"
        accept="image/*"
        onChange={handleImageChange}
        className="hidden"
      />
    </label>

    {/* Clear file name text */}
    {imageFile && (
      <span className="text-xs sm:text-sm text-slate-300 truncate max-w-[200px]">
        {imageFile.name}
      </span>
    )}

    {/* Upload button */}
    <button
      type="button"
      onClick={handleUploadImage}
      disabled={!imageFile || uploadingImage}
      className="inline-flex items-center justify-center px-4 py-2 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 text-white text-xs sm:text-sm font-semibold shadow-md shadow-orange-500/30 hover:shadow-orange-500/50 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 transition-all duration-200"
    >
      {uploadingImage ? "Uploading..." : "Upload image"}
    </button>
  </div>

  {imagePreview && (
    <div className="mt-2 flex flex-col sm:flex-row gap-3 sm:items-center">
      <img
        src={imagePreview}
        alt="Preview"
        className="h-32 w-48 rounded-xl border border-slate-700 object-cover"
      />
      <p className="text-xs text-slate-400">
        This is your local preview. Click “Upload image” to attach it
        to your BharatBlog post.
      </p>
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
              <div className="border border-slate-700 rounded-2xl bg-slate-900/80 overflow-hidden">
                <MDEditor
                  value={content}
                  onChange={(val) => setContent(val || "")}
                  height={320}
                  textareaProps={{
                    placeholder: "Write your post in Markdown...",
                  }}
                />
              </div>
              <p className="mt-1 text-xs text-slate-400">
                Supports headings, **bold**, _italic_, lists, links, tables, and
                more.
              </p>
            </div>

            {/* Quick link inserter */}
            <div className="border border-slate-700 rounded-2xl p-3 bg-slate-900/70 space-y-2">
              <p className="text-xs text-slate-300">
                Quick link helper <span className="text-slate-500">(no need to type https)</span>:
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={rawLinkLabel}
                  onChange={(e) => setRawLinkLabel(e.target.value)}
                  placeholder="Link text (e.g. Google)"
                  className="flex-1 rounded-xl border border-slate-600 bg-slate-900 px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <input
                  type="text"
                  value={rawLinkUrl}
                  onChange={(e) => setRawLinkUrl(e.target.value)}
                  placeholder="google.com"
                  className="flex-1 rounded-xl border border-slate-600 bg-slate-900 px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <button
                  type="button"
                  onClick={handleInsertLink}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-100 text-xs font-medium hover:bg-slate-700"
                >
                  Insert link
                </button>
              </div>
            </div>

            {/* Submit */}
            <div className="flex items-center justify-between gap-3">
              <p className="text-[11px] text-slate-500">
                Your post will appear in the BharatBlog feed after publishing.
              </p>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center justify-center px-5 py-2.5 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-sm font-semibold hover:shadow-lg hover:shadow-emerald-500/30 disabled:opacity-60 transition-all"
              >
                {submitting ? "Publishing..." : "Publish post"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
