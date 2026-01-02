require("dotenv").config();
const express = require("express");
const admin = require("firebase-admin");
const path = require("path");

const app = express();
app.set("trust proxy", 1); // 🔴 REQUIRED ON RENDER
const PORT = process.env.PORT || 4000;

/* =========================================================
   🔥 HARD CORS FIX (RENDER-PROOF)
========================================================= */

const FRONTEND_ORIGIN = "https://blog-app-219e7.web.app";

/* 🔴 PRE-FLIGHT — MUST BE FIRST */
app.options("/api/send-notification", (req, res) => {
  res.status(204)
    .set({
      "Access-Control-Allow-Origin": FRONTEND_ORIGIN,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Content-Length": "0",
    })
    .end();
});

/* 🔴 NORMAL REQUESTS */
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", FRONTEND_ORIGIN);
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  next();
});

app.use(express.json());

/* =========================================================
   🔥 FIREBASE ADMIN
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

async function sendNotificationToUser({ targetUid, title, body, link, iconUrl }) {
  const snap = await db
    .collection("users")
    .doc(targetUid)
    .collection("fcmTokens")
    .get();

  if (snap.empty) return { successCount: 0, failureCount: 0 };

  const tokens = snap.docs.map((d) => d.id);

  const message = {
    tokens,
    notification: { title, body },
    webpush: {
      notification: {
        icon: iconUrl || `${FRONTEND_ORIGIN}/icons/icon-192.png`,
      },
      fcm_options: {
        link: link || FRONTEND_ORIGIN,
      },
    },
  };

  const response = await admin.messaging().sendEachForMulticast(message);

  return {
    successCount: response.successCount,
    failureCount: response.failureCount,
  };
}

/* =========================================================
   🚀 ROUTES
========================================================= */

app.get("/", (_req, res) => {
  res.send("Notification server running");
});

app.post("/api/send-notification", async (req, res) => {
  try {
    const result = await sendNotificationToUser(req.body);
    res.json(result);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
});

/* =========================================================
   ▶ START
========================================================= */

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
