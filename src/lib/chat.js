// src/lib/chat.js
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "./firebase";

/**
 * Build a stable key for a 1‑1 conversation between two users.
 * Order is deterministic so A+B is same as B+A.
 */
export function getConversationKey(uid1, uid2) {
  if (!uid1 || !uid2) {
    throw new Error("Both uid1 and uid2 are required to build a conversation key");
  }
  return [uid1, uid2].sort().join("_");
}

/**
 * Lightweight profile shape used inside chat UIs.
 */
export async function getUserProfileLite(uid) {
  if (!uid) {
    return {
      name: "BharatBlog user",
      avatarUrl: "",
    };
  }

  const userRef = doc(db, "users", uid);
  const snap = await getDoc(userRef);

  if (!snap.exists()) {
    return {
      name: "BharatBlog user",
      avatarUrl: "",
    };
  }

  const data = snap.data() || {};
  const email = data.email || "";
  const baseName = data.name || (email ? email.split("@")[0] : "BharatBlog user");

  const avatarUrl =
    data.avatarUrl ||
    (email
      ? `https://api.dicebear.com/7.x/bottts/png?seed=${encodeURIComponent(email)}`
      : "");

  return {
    name: baseName,
    avatarUrl,
  };
}

/**
 * Find an existing 1‑1 conversation or create a new one.
 */
export async function findOrCreateConversation(currentUser, otherUser) {
  if (!currentUser?.uid || !otherUser?.uid) {
    throw new Error("Both currentUser and otherUser must have a uid");
  }

  const myUid = currentUser.uid;
  const otherUid = otherUser.uid;
  const key = getConversationKey(myUid, otherUid);

  const convRef = collection(db, "conversations");
  const q = query(convRef, where("conversationKey", "==", key), limit(1));
  const snap = await getDocs(q);

  if (!snap.empty) {
    const docSnap = snap.docs[0];
    return { id: docSnap.id, ...docSnap.data() };
  }

  const [myProfile, otherProfile] = await Promise.all([
    getUserProfileLite(myUid),
    getUserProfileLite(otherUid),
  ]);

  const participantInfo = {
    [myUid]: {
      name: myProfile.name,
      avatarUrl: myProfile.avatarUrl,
    },
    [otherUid]: {
      name: otherProfile.name,
      avatarUrl: otherProfile.avatarUrl,
    },
  };

  const newConv = {
    conversationKey: key,
    participants: [myUid, otherUid],
    participantInfo,
    lastMessage: null,
    unreadFor: [],
    createdAt: serverTimestamp(),
  };

  const docRef = await addDoc(convRef, newConv);
  return { id: docRef.id, ...newConv };
}

/**
 * Create a message document and update conversation metadata.
 */
export async function sendMessage(conversationId, senderId, receiverId, text) {
  const cleanText = text?.trim();
  if (!cleanText) return null;
  if (!conversationId || !senderId || !receiverId) {
    throw new Error("conversationId, senderId and receiverId are required to send a message");
  }

  const messagesRef = collection(db, "messages");
  const createdAt = serverTimestamp();

  const messageDocRef = await addDoc(messagesRef, {
    conversationId,
    senderId,
    receiverId,
    text: cleanText,
    createdAt,
    seenBy: [senderId],
  });

  const convRef = doc(db, "conversations", conversationId);

  await updateDoc(convRef, {
    lastMessage: {
      text: cleanText,
      senderId,
      receiverId,
      createdAt,
    },
    unreadFor: [receiverId],
  });

  return messageDocRef.id;
}

/**
 * Subscribe to messages in a conversation, ordered oldest → newest.
 * Returns unsubscribe function.
 */
export function subscribeToMessages(conversationId, callback, onError) {
  if (!conversationId) {
    throw new Error("conversationId is required to subscribe to messages");
  }

  const messagesRef = collection(db, "messages");
  const q = query(
    messagesRef,
    where("conversationId", "==", conversationId),
    orderBy("createdAt", "asc")
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const msgs = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));
      callback(msgs);
    },
    (error) => {
      console.error("Messages subscription error:", error);
      if (onError) onError(error);
    }
  );
}

/**
 * Subscribe to all conversations for a user, ordered by recent activity.
 * Returns unsubscribe function.
 */
export function subscribeToConversations(userId, callback, onError) {
  if (!userId) {
    throw new Error("userId is required to subscribe to conversations");
  }

  const convRef = collection(db, "conversations");
  const q = query(
    convRef,
    where("participants", "array-contains", userId),
    orderBy("lastMessage.createdAt", "desc")
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const conversations = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));
      callback(conversations);
    },
    (error) => {
      console.error("Conversations subscription error:", error);
      if (onError) onError(error);
    }
  );
}

/**
 * Mark a conversation as read for a given user by removing them from unreadFor.
 */
export async function markConversationRead(conversationId, userId) {
  if (!conversationId || !userId) return;

  const convRef = doc(db, "conversations", conversationId);
  const snap = await getDoc(convRef);
  if (!snap.exists()) return;

  const data = snap.data() || {};
  const unreadFor = Array.isArray(data.unreadFor) ? data.unreadFor : [];

  if (!unreadFor.includes(userId)) return;

  const updated = unreadFor.filter((uid) => uid !== userId);

  await updateDoc(convRef, { unreadFor: updated });
}

/**
 * Get any FCM registration token for a user (used for push notifications).
 * Assumes you store tokens under users/{uid}/fcmTokens/{token}.
 */
export async function getAnyFcmTokenForUser(uid) {
  if (!uid) return null;

  try {
    const tokensCol = collection(db, "users", uid, "fcmTokens");
    const q = query(tokensCol, limit(1));
    const snap = await getDocs(q);

    if (snap.empty) return null;

    // token is stored as document ID; adjust if your schema differs
    return snap.docs[0].id;
  } catch (err) {
    console.error("getAnyFcmTokenForUser error:", err);
    return null;
  }
}
