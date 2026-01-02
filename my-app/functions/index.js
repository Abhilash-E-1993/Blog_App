// functions/index.js
const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

exports.sendTestNotification = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Must be authenticated to send notifications."
    );
  }

  const targetUid = data.targetUid;
  const title = data.title || "Test notification";
  const body = data.body || "Hello from Cloud Functions";

  if (!targetUid) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "targetUid is required."
    );
  }

  try {
    const tokensSnap = await admin
      .firestore()
      .collection("users")
      .doc(targetUid)
      .collection("fcmTokens")
      .get();

    if (tokensSnap.empty) {
      console.log("No tokens for user", targetUid);
      return { successCount: 0, failureCount: 0 };
    }

    const tokens = tokensSnap.docs.map((doc) => doc.id);

    const message = {
      tokens,
      notification: { title, body },
    };

    const response = await admin.messaging().sendEachForMulticast(message);

    const deletes = [];
    response.responses.forEach((res, idx) => {
      if (!res.success) {
        const errorCode = res.error && res.error.code;
        console.log("Error for token", tokens[idx], errorCode);
        if (
          errorCode === "messaging/registration-token-not-registered" ||
          errorCode === "messaging/invalid-registration-token"
        ) {
          deletes.push(
            admin
              .firestore()
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
  } catch (err) {
    console.error("sendTestNotification error", err);
    throw new functions.https.HttpsError(
      "internal",
      "Failed to send notification."
    );
  }
});
