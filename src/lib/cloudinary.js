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
