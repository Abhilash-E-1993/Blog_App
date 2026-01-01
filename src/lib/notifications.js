// src/lib/notifications.js
import { getMessagingIfSupported } from "./firebase";
import { getToken, onMessage } from "firebase/messaging";

const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;

export const requestNotificationPermission = async () => {
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
    if (currentToken) {
      console.log("FCM token:", currentToken);
      // TODO: send token to your backend / Firestore
      return currentToken;
    } else {
      console.log("No registration token available.");
      return null;
    }
  } catch (err) {
    console.error("Error while retrieving token:", err);
    return null;
  }
};

export const subscribeToForegroundMessages = async (cb) => {
  const messaging = await getMessagingIfSupported();
  if (!messaging) return () => {};

  return onMessage(messaging, (payload) => {
    console.log("Foreground message:", payload);
    cb?.(payload);
  });
};
