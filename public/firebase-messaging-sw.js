/* global self */
importScripts("https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyAv28UmMszmo8MQ-FKjWjsIDvVSFvH-VOE",
  authDomain: "blog-app-219e7.firebaseapp.com",
  projectId: "blog-app-219e7",
  storageBucket: "blog-app-219e7.firebasestorage.app",
  messagingSenderId: "748875717904",
  appId: "1:748875717904:web:83f22b1b0628f615915995",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log("[firebase-messaging-sw.js] Background message received:", payload);

  const notificationTitle = payload.notification?.title || "BharatBlog";
  const notificationOptions = {
    body: payload.notification?.body || "",
    icon: "/android-chrome-192x192.png",
    data: payload.data || {},
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const urlToOpen = event.notification?.data?.click_action || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientsArr) => {
      const hadWindow = clientsArr.some((client) => {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.focus();
          client.postMessage({ type: "NOTIFICATION_CLICKED", data: event.notification.data });
          return true;
        }
        return false;
      });

      if (!hadWindow && self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
      return null;
    })
  );
});
