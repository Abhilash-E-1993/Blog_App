// src/lib/likes.js
import {
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  increment,
} from "firebase/firestore";
import { db } from "./firebase";

export async function togglePostLike(postId, userId) {
  const postRef = doc(db, "posts", postId);
  const snap = await getDoc(postRef);

  if (!snap.exists()) {
    throw new Error("Post not found");
  }

  const data = snap.data();
  const likedBy = Array.isArray(data.likedBy) ? data.likedBy : [];
  const hasLiked = likedBy.includes(userId);

  // Use atomic increment and arrayUnion/arrayRemove
  // so multiple users can like at the same time safely. [web:42][web:52][web:53]
  if (hasLiked) {
    await updateDoc(postRef, {
      likedBy: arrayRemove(userId),
      likesCount: increment(-1),
    });
    return { liked: false };
  } else {
    await updateDoc(postRef, {
      likedBy: arrayUnion(userId),
      likesCount: increment(1),
    });
    return { liked: true };
  }
}
