import { useEffect, useRef, useState } from "react";
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

  const messagesEndRef = useRef(null);

  // auto-scroll when messages change
  useEffect(() => {
    if (!messagesEndRef.current) return;
    messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // load conversation + subscribe + mark as read
  useEffect(() => {
    let unsubMessages = null;

    const init = async () => {
      if (!conversationId || !currentUser) return;

      try {
        setLoading(true);
        setError("");

        const convRef = doc(db, "conversations", conversationId);
        const convSnap = await getDoc(convRef);
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

        let otherInfo =
          convData.participantInfo && convData.participantInfo[otherUid]
            ? convData.participantInfo[otherUid]
            : null;

        if (!otherInfo) {
          const profile = await getUserProfileLite(otherUid);
          otherInfo = profile;
        }

        setOtherUser({
          uid: otherUid,
          name: otherInfo.name,
          avatarUrl: otherInfo.avatarUrl || "",
        });

        await markConversationRead(conversationId, currentUser.uid);

        unsubMessages = subscribeToMessages(
          conversationId,
          (msgs) => {
            setMessages(msgs);
            setLoading(false);
          },
          (err) => {
            console.error(err);
            setError("Failed to load messages.");
            setLoading(false);
          }
        );
      } catch (err) {
        console.error(err);
        setError("Failed to open conversation.");
        setLoading(false);
      }
    };

    init();

    return () => {
      if (unsubMessages) unsubMessages();
    };
  }, [conversationId, currentUser?.uid]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || !currentUser || !otherUser || sending) return;

    try {
      setSending(true);
      await sendMessage(
        conversationId,
        currentUser.uid,
        otherUser.uid,
        input.trim()
      );
      setInput("");
    } catch (err) {
      console.error(err);
      setError("Failed to send message.");
    } finally {
      setSending(false);
    }
  };

  if (!conversationId) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-200 text-sm">
        No conversation selected.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-emerald-500/70 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-300 text-sm">Loading conversation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* Top bar */}
      <header className="h-14 flex items-center justify-between px-4 sm:px-6 border-b border-slate-800 bg-slate-950/95 backdrop-blur">
        <button
          type="button"
          onClick={() => navigate("/chats")}
          className="text-xs sm:text-sm text-emerald-400 hover:text-emerald-300"
        >
          ← Back to chats
        </button>

        {otherUser && (
          <div className="flex items-center gap-2 sm:gap-3">
            {otherUser.avatarUrl ? (
              <img
                src={otherUser.avatarUrl}
                alt={otherUser.name}
                className="h-8 w-8 sm:h-9 sm:w-9 rounded-full border border-emerald-500/60 object-cover"
              />
            ) : (
              <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-full border border-emerald-500/60 bg-slate-800 flex items-center justify-center text-[10px] text-slate-300">
                {otherUser.name?.[0] || "U"}
              </div>
            )}
            <div className="flex flex-col">
              <span className="text-sm sm:text-base font-medium text-slate-100">
                {otherUser.name}
              </span>
              <span className="text-[10px] text-emerald-400">
                Direct messages
              </span>
            </div>
          </div>
        )}

        <div className="w-8" />
      </header>

      {error && (
        <div className="px-4 py-2 text-sm text-red-400 bg-red-950/40 border-b border-red-500/40">
          {error}
        </div>
      )}

      {/* Main chat area */}
      <div className="flex-1 flex justify-center">
        <div className="w-full max-w-3xl flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-3 space-y-2">
            {messages.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <p className="text-xs sm:text-sm text-slate-400 text-center max-w-xs">
                  No messages yet. Say hello and start the conversation.
                </p>
              </div>
            ) : (
              messages.map((m) => {
                const isMine = m.senderId === currentUser.uid;
                const timeText = formatTime(m.createdAt);
                return (
                  <div
                    key={m.id}
                    className={`flex ${
                      isMine ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[80%] sm:max-w-[70%] rounded-2xl px-3 py-1.5 text-xs sm:text-sm shadow-sm ${
                        isMine
                          ? "bg-emerald-500 text-white rounded-br-sm"
                          : "bg-slate-800 text-slate-100 rounded-bl-sm"
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words">
                        {m.text}
                      </p>
                      {timeText && (
                        <p
                          className={`mt-0.5 text-[10px] ${
                            isMine ? "text-emerald-100/80" : "text-slate-400"
                          } text-right`}
                        >
                          {timeText}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input bar */}
          <form
            onSubmit={handleSubmit}
            className="border-t border-slate-800 px-3 sm:px-4 py-3 bg-slate-950/95 flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 rounded-full bg-slate-900 border border-slate-700 px-3 py-2 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
            <button
              type="submit"
              disabled={!input.trim() || sending}
              className="inline-flex items-center justify-center px-4 py-2 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-xs sm:text-sm font-semibold shadow-md shadow-emerald-500/30 hover:shadow-emerald-500/50 disabled:opacity-60 transition-all"
            >
              {sending ? "Sending..." : "Send"}
            </button>
          </form>
        </div>
      </div>
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
