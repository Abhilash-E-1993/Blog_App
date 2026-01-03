// src/lib/notifications.js
import { getMessagingIfSupported, auth, db } from "./firebase";
import { getToken, onMessage } from "firebase/messaging";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;

// Ask permission, get FCM token, save under users/{uid}/fcmTokens/{token}
export const requestNotificationPermission = async () => {
  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.warn("Notification permission not granted:", permission);
      return null;
    }

    const messaging = await getMessagingIfSupported();
    if (!messaging) {
      console.warn("Messaging not supported in this environment");
      return null;
    }

    const currentToken = await getToken(messaging, { vapidKey });
    if (!currentToken) {
      console.warn("No registration token available");
      return null;
    }

    const user = auth.currentUser;
    if (user?.uid) {
      const tokenRef = doc(db, "users", user.uid, "fcmTokens", currentToken);
      await setDoc(
        tokenRef,
        {
          createdAt: serverTimestamp(),
          platform: navigator.userAgent || "web",
        },
        { merge: true }
      );
    }

    console.log("FCM token:", currentToken);
    return currentToken;
  } catch (err) {
    console.error("Error while retrieving FCM token:", err);
    return null;
  }
};

// Foreground messages → in-app handling only
export const subscribeToForegroundMessages = async (cb) => {
  const messaging = await getMessagingIfSupported();
  if (!messaging) return () => {};

  return onMessage(messaging, (payload) => {
    console.log("Foreground message:", payload);
    cb?.(payload);
  });
};
