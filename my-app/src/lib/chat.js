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

// Stable key for a 1‑1 conversation
export function getConversationKey(uid1, uid2) {
  return [uid1, uid2].sort().join("_");
}

// Lightweight profile for chats
export async function getUserProfileLite(uid) {
  const userRef = doc(db, "users", uid);
  const snap = await getDoc(userRef);

  if (!snap.exists()) {
    return {
      name: "BharatBlog user",
      avatarUrl: "",
    };
  }

  const data = snap.data();
  const email = data.email || "";
  const baseName = data.name || (email ? email.split("@")[0] : "BharatBlog user");
  const avatarUrl =
    data.avatarUrl ||
    (email
      ? `https://api.dicebear.com/7.x/bottts/png?seed=${encodeURIComponent(
          email
        )}`
      : "");

  return {
    name: baseName,
    avatarUrl,
  };
}

// Find or create 1‑1 conversation
export async function findOrCreateConversation(currentUser, otherUser) {
  const { uid: myUid } = currentUser;
  const { uid: otherUid } = otherUser;

  const key = getConversationKey(myUid, otherUid);

  const convRef = collection(db, "conversations");
  const q = query(convRef, where("conversationKey", "==", key), limit(1));
  const snap = await getDocs(q);

  if (!snap.empty) {
    const docSnap = snap.docs[0];
    return { id: docSnap.id, ...docSnap.data() };
  }

  const myProfile = await getUserProfileLite(myUid);
  const otherProfile = await getUserProfileLite(otherUid);

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
    // unreadFor: which users currently have unread messages
    unreadFor: [],
    createdAt: serverTimestamp(),
  };

  const docRef = await addDoc(convRef, newConv);

  return { id: docRef.id, ...newConv };
}

// Send message + update lastMessage + unreadFor
export async function sendMessage(conversationId, senderId, receiverId, text) {
  if (!text.trim()) return;

  const messagesRef = collection(db, "messages");
  const createdAt = serverTimestamp();
  const cleanText = text.trim();

  const msgDoc = await addDoc(messagesRef, {
    conversationId,
    senderId,
    receiverId,
    text: cleanText,
    createdAt,
    // seenBy includes sender by default
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
    // receiver has unread messages, sender does not
    unreadFor: [receiverId],
  });

  return msgDoc.id;
}

// Subscribe to messages in a conversation
export function subscribeToMessages(conversationId, callback, onError) {
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

// Subscribe to all conversations for a user
export function subscribeToConversations(userId, callback, onError) {
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

// Mark conversation as read for one user (clear unreadFor)
export async function markConversationRead(conversationId, userId) {
  const convRef = doc(db, "conversations", conversationId);
  const snap = await getDoc(convRef);
  if (!snap.exists()) return;

  const data = snap.data();
  const unreadFor = Array.isArray(data.unreadFor) ? data.unreadFor : [];

  // If user already not in unreadFor, nothing to do
  if (!unreadFor.includes(userId)) return;

  const updated = unreadFor.filter((uid) => uid !== userId);

  await updateDoc(convRef, {
    unreadFor: updated,
  });
}
