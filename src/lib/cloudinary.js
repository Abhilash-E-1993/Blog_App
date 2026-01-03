// src/lib/cloudinary.js (or .ts)
const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

if (!CLOUD_NAME || !UPLOAD_PRESET) {
  console.warn("Missing Cloudinary env vars. Check .env.");
}

export async function uploadImageToCloudinary(file) {
  if (!file) throw new Error("No file provided");

  // Basic client-side checks
  const maxSizeMB = 5;
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    throw new Error(`File too large. Max ${maxSizeMB}MB allowed.`);
  }

  if (!file.type.startsWith("image/")) {
    throw new Error("Only image files are allowed.");
  }

  const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);

  const res = await fetch(url, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    console.error("Cloudinary upload error:", errorData);
    throw new Error(errorData.error?.message || "Cloudinary upload failed");
  }

  const data = await res.json();
  // secure_url is the https URL you will store in Firestore
  return data.secure_url;
}

/**
 * Build an optimized Cloudinary URL for display.
 * This does NOT change what is stored in Firestore.
 *
 * Example usage:
 *  - feed cards: getOptimizedImageUrl(url, { width: 400 })
 *  - post page: getOptimizedImageUrl(url, { width: 1200 })
 */
export function getOptimizedImageUrl(
  secureUrl,
  {
    width = 800,
    quality = "auto",
    format = "auto",
    crop = "limit", // do not upscale
  } = {}
) {
  if (!secureUrl) return "";

  // Cloudinary URLs look like:
  // https://res.cloudinary.com/<cloud>/image/upload/v123456/abcd.jpg
  // We insert transformations after `/upload/`
  const uploadSegment = "/upload/";
  const index = secureUrl.indexOf(uploadSegment);
  if (index === -1) {
    // Not a Cloudinary URL, just return as-is
    return secureUrl;
  }

  const before = secureUrl.slice(0, index + uploadSegment.length);
  const after = secureUrl.slice(index + uploadSegment.length);

  // Build transformation string: example "f_auto,q_auto,w_800,c_limit"
  const parts = [];
  if (format) parts.push(`f_${format}`);
  if (quality) parts.push(`q_${quality}`);
  if (width) parts.push(`w_${width}`);
  if (crop) parts.push(`c_${crop}`);

  const transformation = parts.join(",");

  return `${before}${transformation}/${after}`;
}
