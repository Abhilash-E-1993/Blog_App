// server/index.js
require("dotenv").config();
const express = require("express");
const admin = require("firebase-admin");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 4000;

/* =========================================================
   🔥 HARD RENDER-SAFE CORS (FINAL FIX)
========================================================= */

const FRONTEND_ORIGIN = "https://blog-app-219e7.web.app";

/* 🔴 CRITICAL: explicit OPTIONS for the exact API route */
app.options("/api/send-notification", (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", FRONTEND_ORIGIN);
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  return res.sendStatus(204);
});

/* Normal requests */
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", FRONTEND_ORIGIN);
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  next();
});

app.use(express.json());

/* =========================================================
   🔥 FIREBASE ADMIN INIT
========================================================= */

const serviceAccountConfig = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON
  ? JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON)
  : require(path.join(__dirname, "serviceAccountKey.json"));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccountConfig),
});

const db = admin.firestore();

/* =========================================================
   🔔 PUSH HELPER
========================================================= */

async function sendNotificationToUser({
  targetUid,
  title,
  body,
  link,
  iconUrl,
}) {
  const snap = await db
    .collection("users")
    .doc(targetUid)
    .collection("fcmTokens")
    .get();

  if (snap.empty) {
    return { successCount: 0, failureCount: 0 };
  }

  const tokens = snap.docs.map((d) => d.id);

  const message = {
    tokens,
    notification: { title, body },
    webpush: {
      notification: {
        icon:
          iconUrl ||
          "https://blog-app-219e7.web.app/icons/icon-192.png",
      },
      fcm_options: {
        link: link || "https://blog-app-219e7.web.app",
      },
    },
  };

  const response = await admin
    .messaging()
    .sendEachForMulticast(message);

  return {
    successCount: response.successCount,
    failureCount: response.failureCount,
  };
}

/* =========================================================
   🚀 ROUTES
========================================================= */

app.get("/", (_req, res) => {
  res.send("✅ Notification server running");
});

app.post("/api/send-notification", async (req, res) => {
  try {
    const { targetUid, title, body, link, iconUrl } = req.body;

    if (!targetUid || !title || !body) {
      return res.status(400).json({ error: "Invalid payload" });
    }

    const result = await sendNotificationToUser({
      targetUid,
      title,
      body,
      link,
      iconUrl,
    });

    res.json(result);
  } catch (err) {
    console.error("send-notification error", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/* =========================================================
   ▶ START
========================================================= */

app.listen(PORT, () => {
  console.log(`🚀 Notification server running on port ${PORT}`);
});
