// src/lib/notifications.js
import { db, getMessagingIfSupported } from "./firebase";
import { getToken, onMessage } from "firebase/messaging";
import { doc, setDoc } from "firebase/firestore";

const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;

/**
 * Request permission, get FCM token and save it for this user.
 * Call this after the user is logged in, passing user.uid.
 */
export const requestAndSaveFcmToken = async (uid) => {
  if (!uid) return null;

  const messaging = await getMessagingIfSupported();
  if (!messaging) {
    console.warn("FCM not supported in this browser");
    return null;
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    console.log("Notification permission not granted");
    return null;
  }

  try {
    const currentToken = await getToken(messaging, { vapidKey });
    if (!currentToken) {
      console.log("No registration token available.");
      return null;
    }

    console.log("FCM token:", currentToken);

    // Save token as a document: users/{uid}/fcmTokens/{token}
    const tokenRef = doc(db, "users", uid, "fcmTokens", currentToken);
    await setDoc(
      tokenRef,
      {
        createdAt: Date.now(),
        platform: "web",
      },
      { merge: true }
    );

    return currentToken;
  } catch (err) {
    console.error("Error while retrieving token:", err);
    return null;
  }
};

/**
 * Subscribe to foreground messages.
 * Call once (e.g. in App) and pass a callback to handle messages.
 */
export const subscribeToForegroundMessages = async (cb) => {
  const messaging = await getMessagingIfSupported();
  if (!messaging) return () => {};

  return onMessage(messaging, (payload) => {
    console.log("Foreground message:", payload);
    cb?.(payload);
  });
};
