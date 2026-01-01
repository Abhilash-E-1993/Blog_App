// src/lib/messaging.js
import { getToken, onMessage } from "firebase/messaging";
import { doc, updateDoc } from "firebase/firestore";
import { messaging, db } from "./firebase";

const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;

/**
 * Ask user for notification permission and, if granted,
 * get FCM token and save it on the user's document.
 */
export async function initMessagingForUser(userId) {
  if (!userId || !("Notification" in window)) return;

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    return;
  }

  const token = await getToken(messaging, { vapidKey });
  if (!token) return;

  const userRef = doc(db, "users", userId);
  await updateDoc(userRef, { fcmToken: token });
}

/**
 * Listen for foreground messages (when tab is open).
 * You can later show a toast/snackbar for chat messages.
 */
export function listenForForegroundMessages(callback) {
  return onMessage(messaging, (payload) => {
    if (typeof callback === "function") {
      callback(payload);
    }
  });
}
