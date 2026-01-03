// src/lib/notificationsApi.js
const API_BASE =
  import.meta.env.VITE_NOTIFICATIONS_API_BASE || "http://localhost:8080";

console.log("Notifications API_BASE:", API_BASE);

async function postJson(path, payload, label) {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      console.error(`${label} failed:`, res.status, errBody);
      return null;
    }

    const json = await res.json();
    console.log(`${label} result:`, json);
    return json;
  } catch (err) {
    console.error(`${label} error:`, err);
    return null;
  }
}

export async function sendChatNotification({ receiverUid, title, body, data }) {
  if (!receiverUid) {
    console.warn("sendChatNotification: missing receiverUid");
    return null;
  }
  if (!title || !body) {
    console.warn("sendChatNotification: missing title/body");
    return null;
  }

  return postJson(
    "/api/send-chat-notification",
    { receiverUid, title, body, data },
    "sendChatNotification"
  );
}

export async function sendPostNotification({ receiverUid, title, body, data }) {
  if (!receiverUid) {
    console.warn("sendPostNotification: missing receiverUid");
    return null;
  }
  if (!title || !body) {
    console.warn("sendPostNotification: missing title/body");
    return null;
  }

  return postJson(
    "/api/send-post-notification",
    { receiverUid, title, body, data },
    "sendPostNotification"
  );
}
