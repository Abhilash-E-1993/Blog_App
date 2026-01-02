// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "./App.jsx";
import "./index.css";

import { AuthProvider } from "./context/AuthContext.jsx";
import { ChatUnreadProvider } from "./context/ChatUnreadContext.jsx";

/* ======================================================
   🔔 REGISTER FIREBASE MESSAGING SERVICE WORKER
   (MUST be before app logic runs)
====================================================== */
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/firebase-messaging-sw.js")
      .then((registration) => {
        console.log(
          "✅ Firebase Messaging SW registered:",
          registration.scope
        );
      })
      .catch((err) => {
        console.error("❌ SW registration failed:", err);
      });
  });
}

/* ======================================================
   🚀 RENDER APP
   (StrictMode removed to avoid double effects + token bugs)
====================================================== */
ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <AuthProvider>
      <ChatUnreadProvider>
        <App />
      </ChatUnreadProvider>
    </AuthProvider>
  </BrowserRouter>
);
