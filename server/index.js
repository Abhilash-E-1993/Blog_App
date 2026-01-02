// server/index.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const admin = require("firebase-admin");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 4000;

// ---------- CORS CONFIG ----------
const rawOrigins =
  process.env.CORS_ORIGINS ||
  "http://localhost:5173,https://blog-app-219e7.web.app,https://blog-app-219e7.firebaseapp.com";

const allowedOrigins = rawOrigins
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

const corsOptions = {
  origin(origin, callback) {
    // allow server-to-server / health checks with no origin
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`Not allowed by CORS: ${origin}`));
  },
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type"],
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

app.use(express.json());

// ---------- FIREBASE ADMIN INIT ----------
let serviceAccountConfig;

if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
  try {
    serviceAccountConfig = JSON.parse(
      process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON
    );
  } catch (e) {
    console.error("Invalid GOOGLE_APPLICATION_CREDENTIALS_JSON", e);
    process.exit(1);
  }
} else {
  try {
    serviceAccountConfig = require(path.join(__dirname, "serviceAccountKey.json"));
  } catch (e) {
    console.error(
      "Missing serviceAccountKey.json and GOOGLE_APPLICATION_CREDENTIALS_JSON. Add one of them."
    );
    process.exit(1);
  }
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccountConfig),
});

const db = admin.firestore();

// ---------- HELPERS ----------

// Send a push notification to all FCM tokens of a single user
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
    return { successCount: 0, failureCount: 0, message: "No tokens" };
  }

  const tokens = tokensSnap.docs.map((doc) => doc.id);

  const message = {
    tokens,
    notification: {
      title,
      body,
    },
    webpush: {
      notification: {
        icon:
          iconUrl ||
          "https://blog-app-219e7.web.app/icons/icon-192.png",
        badge:
          "https://blog-app-219e7.web.app/icons/badge-72.png",
      },
      fcm_options: {
        link: link || "https://blog-app-219e7.web.app",
      },
    },
  };

  const response = await admin.messaging().sendEachForMulticast(message); // [web:49]

  // Clean up invalid tokens
  const deletes = [];
  response.responses.forEach((r, idx) => {
    if (!r.success) {
      const code = r.error && r.error.code;
      if (
        code === "messaging/registration-token-not-registered" ||
        code === "messaging/invalid-registration-token"
      ) {
        deletes.push(
          db
            .collection("users")
            .doc(targetUid)
            .collection("fcmTokens")
            .doc(tokens[idx])
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

// ---------- ROUTES ----------

// Health check
app.get("/", (_req, res) => {
  res.send("Notification server is running");
});

// Generic send-notification (used by chat/profile)
app.post("/api/send-notification", async (req, res) => {
  try {
    const { targetUid, title, body, link, iconUrl } = req.body;

    if (!targetUid || !title || !body) {
      return res
        .status(400)
        .json({ error: "targetUid, title and body are required" });
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

// New post notification (called from CreatePostPage)
app.post("/api/notify-new-post", async (req, res) => {
  try {
    const { postId, authorId, authorName, title, slug } = req.body;

    if (!postId || !authorId || !title || !slug) {
      return res.status(400).json({
        error: "postId, authorId, title and slug are required",
      });
    }

    // For now: notify only the author so you can test the flow.
    const targetUid = authorId;

    const messageTitle = "BharatBlog · Story published";
    const messageBody = `${authorName || "BharatBlog author"} just published “${title}”.`;

    const link = `https://blog-app-219e7.web.app/post/${slug}`;
    const iconUrl = "https://blog-app-219e7.web.app/icons/icon-192.png";

    const result = await sendNotificationToUser({
      targetUid,
      title: messageTitle,
      body: messageBody,
      link,
      iconUrl,
    });

    res.json({
      postId,
      notifiedUser: targetUid,
      ...result,
    });
  } catch (err) {
    console.error("notify-new-post error", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ---------- START SERVER ----------
app.listen(PORT, () => {
  console.log(`Notification server listening on port ${PORT}`);
});
