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
import { sendChatNotification } from "../lib/notificationsApi";

export default function ChatPage() {
  const { conversationId } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [otherUser, setOtherUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

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
        setIsTyping(false);

        await sendMessage(
          conversationId,
          currentUser.uid,
          otherUser.uid,
          trimmedInput
        );

        // Fire-and-forget chat notification via backend (by receiverUid)
        sendChatNotification({
          receiverUid: otherUser.uid,
          title: `${currentUser.displayName || "New message"} · Chat`,
          body:
            trimmedInput.length > 60
              ? `${trimmedInput.slice(0, 57)}...`
              : trimmedInput,
          data: {
            click_action: `/chat/${conversationId}`,
            conversationId,
            senderId: currentUser.uid,
          },
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
    [input, currentUser, otherUser, sending, conversationId]
  );

  const handleInputChange = useCallback((e) => {
    const value = e.target.value;
    setInput(value);
    setIsTyping(value.length > 0);
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
          label:
            d instanceof Date ? formatDayLabel(d) : "Unknown date",
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
            <div
              key={item.key}
              className="flex justify-center my-2"
            >
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
            className={`flex ${
              isMine ? "justify-end" : "justify-start"
            } animate-fadeIn`}
          >
            <div
              className={`group relative max-w-[85%] sm:max-w-[75%] md:max-w-[65%] rounded-2xl px-4 py-2.5 text-sm shadow-lg transition-all duration-200 ${
                isMine
                  ? "bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-br-md hover:shadow-emerald-500/30"
                  : "bg-slate-800/90 backdrop-blur-sm text-slate-50 rounded-bl-md hover:bg-slate-800 border border-slate-700/50"
              }`}
            >
              <p className="whitespace-pre-wrap break-words leading-relaxed">
                {m.text}
              </p>
              {timeText && (
                <p
                  className={`mt-1 text-[10px] ${
                    isMine ? "text-emerald-50/70" : "text-slate-400"
                  } text-right opacity-0 group-hover:opacity-100 transition-opacity`}
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
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-800/50 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          </div>
          <p className="text-slate-300 text-sm">
            No conversation selected
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 border-4 border-emerald-500/30 rounded-full" />
            <div className="absolute inset-0 w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-slate-300 text-sm font-medium">
            Loading conversation...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col">
      {/* header */}
      <header className="sticky top-0 z-10 h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8 border-b border-slate-800/50 bg-slate-950/80 backdrop-blur-xl">
        <button
          type="button"
          onClick={() => navigate("/chats")}
          className="group flex items-center gap-2 text-sm text-slate-300 hover:text-emerald-400 transition-colors"
        >
          <svg
            className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform"
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
          <span className="hidden sm:inline">Back to chats</span>
        </button>

        {otherUser && (
          <div className="flex items-center gap-3">
            <div className="relative">
              {otherUser.avatarUrl ? (
                <img
                  src={otherUser.avatarUrl}
                  alt={otherUser.name}
                  className="h-10 w-10 rounded-full border-2 border-emerald-500/60 object-cover shadow-lg"
                />
              ) : (
                <div className="h-10 w-10 rounded-full border-2 border-emerald-500/60 bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-sm font-bold text-white shadow-lg">
                  {otherUser.name?.[0]?.toUpperCase() || "U"}
                </div>
              )}
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-slate-950" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-slate-100">
                {otherUser.name}
              </span>
              <span className="text-xs text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                Active now
              </span>
            </div>
          </div>
        )}

        <div className="flex items-center gap-3 text-slate-500 text-xs">
          {/* reserved for future actions */}
        </div>
      </header>

      {error && (
        <div className="px-4 sm:px-6 py-3 text-sm text-red-300 bg-red-950/50 border-b border-red-500/30 backdrop-blur-sm flex items-center gap-2">
          <svg
            className="w-4 h-4 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
          {error}
        </div>
      )}

      {/* messages */}
      <div className="flex-1 flex justify-center overflow-hidden">
        <div className="w-full max-w-4xl flex flex-col">
          <div
            className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 space-y-3 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent"
            aria-live="polite"
          >
            {messages.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center max-w-sm">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-slate-800/50 flex items-center justify-center">
                    <svg
                      className="w-10 h-10 text-slate-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                      />
                    </svg>
                  </div>
                  <p className="text-sm text-slate-400 mb-2">
                    No messages yet
                  </p>
                  <p className="text-xs text-slate-500">
                    Start the conversation by sending a message below
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
            className="border-t border-slate-800/50 px-4 sm:px-6 lg:px-8 py-4 bg-slate-950/80 backdrop-blur-xl"
          >
            <div className="flex items-end gap-3 max-w-4xl mx-auto">
              <div className="flex-1 relative">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Type your message..."
                  rows={1}
                  className="w-full resize-none rounded-2xl bg-slate-900/80 border border-slate-700/50 px-4 py-3 pr-12 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all backdrop-blur-sm max-h-32 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent"
                  style={{ minHeight: "44px" }}
                />
                {input && (
                  <button
                    type="button"
                    onClick={() => {
                      setInput("");
                      setIsTyping(false);
                    }}
                    className="absolute right-3 top-3 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    <svg
                      className="w-5 h-5"
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
                className={`flex-shrink-0 h-11 w-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white font-semibold shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center ${
                  isTyping && !sending
                    ? "typing-glow"
                    : "hover:scale-105 active:scale-95"
                }`}
              >
                {sending ? (
                  <svg
                    className="w-5 h-5 animate-spin"
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
                    className="w-5 h-5"
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
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.25s ease-out;
        }
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
        .typing-glow {
          box-shadow: 0 0 18px rgba(16, 185, 129, 0.7);
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
