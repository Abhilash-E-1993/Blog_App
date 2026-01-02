// server/index.js
require("dotenv").config();
const express = require("express");
const admin = require("firebase-admin");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 4000;

/* =========================================================
   🔥 ABSOLUTE CORS FIX (RENDER + BROWSER SAFE)
========================================================= */

const ALLOWED_ORIGINS = [
  "https://blog-app-219e7.web.app",
  "https://blog-app-219e7.firebaseapp.com",
  "http://localhost:5173",
];

app.use((req, res, next) => {
  const origin = req.headers.origin;

  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }

  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Vary", "Origin");

  // 🔴 THIS IS THE MOST IMPORTANT LINE
  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  next();
});

app.use(express.json());

/* =========================================================
   🔥 FIREBASE ADMIN INIT
========================================================= */

let serviceAccountConfig;

if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
  serviceAccountConfig = JSON.parse(
    process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON
  );
} else {
  serviceAccountConfig = require(path.join(
    __dirname,
    "serviceAccountKey.json"
  ));
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccountConfig),
});

const db = admin.firestore();

/* =========================================================
   🔔 PUSH NOTIFICATION HELPER
========================================================= */

async function sendNotificationToUser({
  targetUid,
  title,
  body,
  link,
  iconUrl,
}) {
  const tokensSnap = await db
    .collection("users")
    .doc(targetUid)
    .collection("fcmTokens")
    .get();

  if (tokensSnap.empty) {
    return { successCount: 0, failureCount: 0 };
  }

  const tokens = tokensSnap.docs.map((doc) => doc.id);

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

  // Clean invalid tokens
  const deletes = [];
  response.responses.forEach((r, i) => {
    if (!r.success) {
      const code = r.error?.code;
      if (
        code === "messaging/invalid-registration-token" ||
        code === "messaging/registration-token-not-registered"
      ) {
        deletes.push(
          db
            .collection("users")
            .doc(targetUid)
            .collection("fcmTokens")
            .doc(tokens[i])
            .delete()
        );
      }
    }
  });

  await Promise.all(deletes);

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
      return res.status(400).json({
        error: "targetUid, title, body required",
      });
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
    res.status(500).json({ error: "Internal error" });
  }
});

app.post("/api/notify-new-post", async (req, res) => {
  try {
    const { authorId, authorName, title, slug } = req.body;

    const link = `https://blog-app-219e7.web.app/post/${slug}`;

    const result = await sendNotificationToUser({
      targetUid: authorId,
      title: "BharatBlog · New post",
      body: `${authorName || "Author"} published “${title}”`,
      link,
    });

    res.json(result);
  } catch (err) {
    console.error("notify-new-post error", err);
    res.status(500).json({ error: "Internal error" });
  }
});

/* =========================================================
   ▶ START SERVER
========================================================= */

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
