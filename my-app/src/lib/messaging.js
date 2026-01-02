// src/lib/messaging.js
import { getToken, onMessage } from "firebase/messaging";
import { doc, setDoc } from "firebase/firestore";
import { messaging, db } from "./firebase";

const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;

/**
 * Ask user for notification permission and, if granted,
 * get FCM token and save it under users/{uid}/fcmTokens/{token}.
 */
export async function initMessagingForUser(userId) {
  if (!userId || typeof window === "undefined") return;
  if (!("Notification" in window)) return;
  if (!messaging) return;

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return;

  const token = await getToken(messaging, { vapidKey });
  if (!token) return;

  // Each device token is a doc ID in subcollection fcmTokens
  const tokenRef = doc(db, "users", userId, "fcmTokens", token);
  await setDoc(
    tokenRef,
    {
      createdAt: new Date(),
      userAgent: navigator.userAgent || "",
    },
    { merge: true }
  );
}

/**
 * Listen for foreground messages (when tab is open).
 * You can later show a toast/snackbar for chat messages.
 */
export function listenForForegroundMessages(callback) {
  if (!messaging) return () => {};

  return onMessage(messaging, (payload) => {
    if (typeof callback === "function") {
      callback(payload);
    }
  });
}
