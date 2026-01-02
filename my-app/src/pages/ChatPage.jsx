// src/pages/ChatPage.jsx
import {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import {
  subscribeToMessages,
  sendMessage,
  getUserProfileLite,
  markConversationRead,
} from "../lib/chat";

const NOTIFICATIONS_API_BASE =
  import.meta.env.PROD
    ? "https://bharatblog-notifications.onrender.com"
    : "http://localhost:4000";

// Sends push notification when a new chat message is created
async function notifyNewMessage({ targetUid, senderName, text, conversationId }) {
  try {
    const preview =
      text.length > 60 ? text.slice(0, 57).trimEnd() + "..." : text;

    const url = `${NOTIFICATIONS_API_BASE}/api/send-notification`;
    console.log("notifyNewMessage URL =", url);

    await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        targetUid,
        title: "BharatBlog · New message",
        body: `${senderName}: ${preview}`,
        link: `https://blog-app-219e7.web.app/chats/${conversationId}`,
        iconUrl: "https://blog-app-219e7.web.app/icons/icon-192.png",
      }),
    });
  } catch (err) {
    console.error("Failed to notify new message:", err);
  }
}

export default function ChatPage() {
  const { conversationId } = useParams();
  const { currentUser, profile } = useAuth();
  const navigate = useNavigate();

  const [otherUser, setOtherUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [input, setInput] = useState("");

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = useCallback((behavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior, block: "end" });
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom(messages.length <= 5 ? "auto" : "smooth");
    }
  }, [messages, scrollToBottom]);

  // Load conversation + subscribe messages
  useEffect(() => {
    let unsubMessages = null;
    let isActive = true;

    const init = async () => {
      if (!conversationId || !currentUser) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const convRef = doc(db, "conversations", conversationId);
        const convSnap = await getDoc(convRef);

        if (!isActive) return;

        if (!convSnap.exists()) {
          setError("Conversation not found.");
          setLoading(false);
          return;
        }

        const convData = convSnap.data();
        const participants = convData.participants || [];

        if (!participants.includes(currentUser.uid)) {
          setError("You are not a participant in this conversation.");
          setLoading(false);
          return;
        }

        const otherUid = participants.find((uid) => uid !== currentUser.uid);
        if (!otherUid) {
          setError("Could not detect other participant.");
          setLoading(false);
          return;
        }

        const otherInfo =
          convData.participantInfo?.[otherUid] ||
          (await getUserProfileLite(otherUid));

        if (!isActive) return;

        setOtherUser({
          uid: otherUid,
          name: otherInfo?.name || "BharatBlog user",
          avatarUrl: otherInfo?.avatarUrl || "",
        });

        await markConversationRead(conversationId, currentUser.uid);

        unsubMessages = subscribeToMessages(
          conversationId,
          (msgs) => {
            if (!isActive) return;
            setMessages(Array.isArray(msgs) ? msgs : []);
            setLoading(false);
          },
          (err) => {
            if (!isActive) return;
            console.error(err);
            setError("Failed to load messages.");
            setLoading(false);
          }
        );
      } catch (err) {
        if (!isActive) return;
        console.error(err);
        setError("Failed to open conversation.");
        setLoading(false);
      }
    };

    init();

    return () => {
      isActive = false;
      if (typeof unsubMessages === "function") unsubMessages();
    };
  }, [conversationId, currentUser?.uid]);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      const trimmedInput = input.trim();
      if (!trimmedInput || !currentUser || !otherUser || sending) return;

      try {
        setSending(true);
        setInput("");

        await sendMessage(
          conversationId,
          currentUser.uid,
          otherUser.uid,
          trimmedInput
        );

        const senderName =
          profile?.name ||
          currentUser.displayName ||
          "BharatBlog user";

        notifyNewMessage({
          targetUid: otherUser.uid,
          senderName,
          text: trimmedInput,
          conversationId,
        });

        inputRef.current?.focus();
      } catch (err) {
        console.error(err);
        setError("Failed to send message. Please try again.");
        setInput(trimmedInput);
      } finally {
        setSending(false);
      }
    },
    [input, currentUser, otherUser, sending, conversationId, profile?.name]
  );

  const handleInputChange = useCallback((e) => {
    setInput(e.target.value);
  }, []);

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit(e);
      }
    },
    [handleSubmit]
  );

  // Group messages by day
  const groupedMessages = useMemo(() => {
    const groups = [];
    let currentDate = null;

    messages.forEach((m) => {
      const d = m.createdAt?.toDate ? m.createdAt.toDate() : m.createdAt;
      const dayKey = d instanceof Date ? d.toDateString() : "Unknown date";

      if (dayKey !== currentDate) {
        currentDate = dayKey;
        groups.push({
          type: "separator",
          key: `sep-${dayKey}`,
          label: d instanceof Date ? formatDayLabel(d) : "Unknown date",
        });
      }

      groups.push({ type: "message", data: m });
    });

    return groups;
  }, [messages]);

  const messageList = useMemo(
    () =>
      groupedMessages.map((item) => {
        if (item.type === "separator") {
          return (
            <div key={item.key} className="flex justify-center my-3">
              <span className="px-3 py-1 rounded-full bg-slate-900/80 border border-slate-700/60 text-[10px] text-slate-400 uppercase tracking-wide shadow-sm">
                {item.label}
              </span>
            </div>
          );
        }

        const m = item.data;
        const isMine = m.senderId === currentUser?.uid;
        const timeText = formatTime(m.createdAt);

        return (
          <div
            key={m.id}
            className={`flex ${isMine ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`group relative max-w-[85%] sm:max-w-[75%] md:max-w-[60%] rounded-2xl px-3.5 py-2.5 text-sm shadow-sm transition-colors ${
                isMine
                  ? "bg-emerald-600 text-white rounded-br-md"
                  : "bg-slate-800 text-slate-50 rounded-bl-md"
              }`}
            >
              <p className="whitespace-pre-wrap break-words leading-relaxed">
                {m.text}
              </p>
              {timeText && (
                <p
                  className={`mt-1 text-[10px] ${
                    isMine ? "text-emerald-50/80" : "text-slate-400"
                  } text-right`}
                >
                  {timeText}
                </p>
              )}
            </div>
          </div>
        );
      }),
    [groupedMessages, currentUser?.uid]
  );

  if (!conversationId) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-300 text-sm">No conversation selected</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-emerald-500/40 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-300 text-sm">Loading conversation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* header */}
      <header className="sticky top-0 z-10 h-14 flex items-center justify-between px-3 sm:px-4 border-b border-slate-800 bg-slate-950/95 backdrop-blur">
        <button
          type="button"
          onClick={() => navigate("/chats")}
          className="flex items-center gap-1.5 text-sm text-slate-300 hover:text-emerald-400"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          <span className="hidden sm:inline">Back</span>
        </button>

        {otherUser && (
          <div className="flex items-center gap-2">
            {otherUser.avatarUrl ? (
              <img
                src={otherUser.avatarUrl}
                alt={otherUser.name}
                className="h-8 w-8 rounded-full object-cover"
              />
            ) : (
              <div className="h-8 w-8 rounded-full bg-emerald-600 flex items-center justify-center text-xs font-bold text-white">
                {otherUser.name?.[0]?.toUpperCase() || "U"}
              </div>
            )}
            <div className="flex flex-col">
              <span className="text-sm font-medium text-slate-100 max-w-[140px] sm:max-w-none truncate">
                {otherUser.name}
              </span>
            </div>
          </div>
        )}

        <div className="w-6" />
      </header>

      {error && (
        <div className="px-3 sm:px-4 py-2 text-xs text-red-300 bg-red-950/40 border-b border-red-500/40 flex items-center gap-2">
          <span>⚠</span>
          <span>{error}</span>
        </div>
      )}

      {/* messages */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div
          className="flex-1 overflow-y-auto px-3 sm:px-4 py-3 sm:py-4 space-y-2 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent"
          aria-live="polite"
        >
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center max-w-xs">
                <p className="text-sm text-slate-400 mb-1">
                  No messages yet
                </p>
                <p className="text-xs text-slate-500">
                  Say hi and start the conversation.
                </p>
              </div>
            </div>
          ) : (
            messageList
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* input */}
        <form
          onSubmit={handleSubmit}
          className="border-t border-slate-800 px-3 sm:px-4 py-2.5 bg-slate-950"
        >
          <div className="flex items-end gap-2 max-w-3xl mx-auto">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Type a message"
                rows={1}
                className="w-full resize-none rounded-2xl bg-slate-900 border border-slate-700 px-3.5 py-2.5 pr-9 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 max-h-28 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent"
                style={{ minHeight: "40px" }}
              />
              {input && (
                <button
                  type="button"
                  onClick={() => setInput("")}
                  className="absolute right-2.5 top-2.5 text-slate-500 hover:text-slate-300"
                >
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              )}
            </div>
            <button
              type="submit"
              disabled={!input.trim() || sending}
              className="flex-shrink-0 h-10 w-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-emerald-500 transition-colors"
            >
              {sending ? (
                <svg
                  className="w-4 h-4 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              ) : (
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                </svg>
              )}
            </button>
          </div>
        </form>
      </div>

      <style jsx>{`
        .scrollbar-thin::-webkit-scrollbar {
          width: 6px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: transparent;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background-color: rgb(51 65 85);
          border-radius: 3px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background-color: rgb(71 85 105);
        }
      `}</style>
    </div>
  );
}

function formatTime(ts) {
  if (!ts) return "";
  try {
    const d = ts.toDate ? ts.toDate() : ts;
    if (!(d instanceof Date)) return "";
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

function formatDayLabel(d) {
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const isSameDay = (a, b) =>
    a.getDate() === b.getDate() &&
    a.getMonth() === b.getMonth() &&
    a.getFullYear() === b.getFullYear();

  if (isSameDay(d, today)) return "Today";
  if (isSameDay(d, yesterday)) return "Yesterday";
  return d.toLocaleDateString([], {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
