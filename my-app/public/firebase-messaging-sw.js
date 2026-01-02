/* global self */
/* eslint-disable no-undef */

importScripts("https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js");

// Same config as in src/lib/firebase.js, but as plain strings
firebase.initializeApp({
  apiKey: "AIzaSyAv28UmMszmo8MQ-FKjWjsIDvVSFvH-VOE",
  authDomain: "blog-app-219e7.firebaseapp.com",
  projectId: "blog-app-219e7",
  storageBucket: "blog-app-219e7.firebasestorage.app",
  messagingSenderId: "748875717904",
  appId: "1:748875717904:web:83f22b1b0628f615915995",
});

const messaging = firebase.messaging();

// Background messages (tab closed / in background)
messaging.onBackgroundMessage((payload) => {
  console.log("[firebase-messaging-sw.js] Background message:", payload);

  const notification = payload.notification || {};
  const title = notification.title || "BharatBlog";
  const options = {
    body: notification.body || "New activity on BharatBlog",
    icon: "/android-chrome-192x192.png",
    data: payload.data || {}, // e.g. { url: "/post/123" }
  };

  self.registration.showNotification(title, options);
});

// Notification click: focus or open the app
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const urlToOpen = event.notification.data?.url || "/";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientsArr) => {
        const hadWindow = clientsArr.some((client) => {
          if (client.url.includes(self.location.origin) && "focus" in client) {
            client.focus();
            return true;
          }
          return false;
        });

        if (!hadWindow && self.clients.openWindow) {
          return self.clients.openWindow(urlToOpen);
        }
      })
  );
});
