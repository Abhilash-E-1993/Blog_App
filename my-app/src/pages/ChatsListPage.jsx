// src/pages/ChatsListPage.jsx
import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { subscribeToConversations } from "../lib/chat";

export default function ChatsListPage() {
  const { currentUser } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // newest chats on top
  const sortedConversations = useMemo(() => {
    return [...conversations].sort((a, b) => {
      const tsA = a.lastMessage?.createdAt;
      const tsB = b.lastMessage?.createdAt;
      const dA = tsA?.toDate ? tsA.toDate() : tsA;
      const dB = tsB?.toDate ? tsB.toDate() : tsB;
      const tA = dA instanceof Date ? dA.getTime() : 0;
      const tB = dB instanceof Date ? dB.getTime() : 0;
      return tB - tA;
    });
  }, [conversations]);

  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      setConversations([]);
      return;
    }

    setLoading(true);
    setError("");

    const unsub = subscribeToConversations(
      currentUser.uid,
      (convs) => {
        setConversations(Array.isArray(convs) ? convs : []);
        setLoading(false);
      },
      (err) => {
        console.error(err);
        setError("Failed to load chats.");
        setLoading(false);
      }
    );

    return () => {
      if (typeof unsub === "function") unsub();
    };
  }, [currentUser?.uid]);

  const handleOpenChat = (convId) => {
    if (!convId) return;
    navigate(`/chat/${convId}`);
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-emerald-500/70 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-300 text-sm">Loading your chats...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-6 px-4 sm:px-0">
      <div className="flex items-center justify-between gap-2 mb-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-50">Chats</h1>
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center rounded-full border border-slate-700 px-3 py-1 text-[11px] text-slate-300 hover:bg-slate-800"
        >
          Back
        </button>
      </div>

      <p className="text-xs sm:text-sm text-slate-400 mb-4">
        Your ongoing conversations on BharatBlog.
      </p>

      {error && (
        <div className="mb-3 text-sm text-red-400 bg-red-950/40 border border-red-500/40 px-3 py-2 rounded-lg">
          {error}
        </div>
      )}

      {sortedConversations.length === 0 && !error && (
        <div className="mt-4 rounded-2xl border border-dashed border-slate-700/70 bg-slate-900/60 px-4 py-6 text-center">
          <p className="text-slate-200 text-sm font-medium mb-1">
            No chats yet.
          </p>
          <p className="text-slate-400 text-xs mb-3">
            Start a conversation from someone&apos;s profile.
          </p>
          <button
            onClick={() => navigate("/feed")}
            className="inline-flex items-center justify-center px-4 py-2 rounded-full bg-emerald-500 text-white text-xs font-medium hover:bg-emerald-600"
          >
            Back to feed
          </button>
        </div>
      )}

      {sortedConversations.length > 0 && (
        <div className="mt-3 rounded-3xl bg-slate-950/90 border border-slate-800 shadow-md shadow-black/30 divide-y divide-slate-800">
          {sortedConversations.map((conv) => {
            const participants = conv.participants || [];
            const otherUid = currentUser
              ? participants.find((uid) => uid !== currentUser.uid)
              : null;

            const info =
              conv.participantInfo && otherUid
                ? conv.participantInfo[otherUid]
                : null;

            const otherName = info?.name || "BharatBlog user";
            const otherAvatar = info?.avatarUrl || "";
            const last = conv.lastMessage || null;

            const lastText =
              last?.text || "Say hi and start the conversation.";
            const lastTime = formatLastTime(last?.createdAt);

            const unreadFor = Array.isArray(conv.unreadFor)
              ? conv.unreadFor
              : [];
            const hasUnread =
              currentUser && unreadFor.includes(currentUser.uid);

            return (
              <button
                key={conv.id}
                onClick={() => handleOpenChat(conv.id)}
                className={`
                  group w-full px-4 py-3 flex items-center justify-between gap-3
                  transition-all duration-150
                  bg-transparent
                  hover:bg-slate-900/80
                  hover:-translate-y-[1px]
                  hover:shadow-[0_6px_18px_rgba(15,23,42,0.85)]
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500
                `}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`
                      relative h-9 w-9 rounded-full border object-cover flex-shrink-0
                      border-slate-700
                      group-hover:border-emerald-400/70
                      transition-colors duration-150
                    `}
                  >
                    {otherAvatar ? (
                      <img
                        src={otherAvatar}
                        alt={otherName}
                        className="h-full w-full rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full rounded-full bg-slate-800 flex items-center justify-center text-[11px] text-slate-200">
                        {otherName[0] || "U"}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-start min-w-0">
                    <span
                      className={`
                        text-sm font-medium truncate max-w-[160px] sm:max-w-[220px]
                        ${hasUnread ? "text-slate-50" : "text-slate-100"}
                      `}
                    >
                      {otherName}
                    </span>
                    <span
                      className={`
                        text-[11px] line-clamp-1 max-w-[180px] sm:max-w-[260px]
                        transition-colors duration-150
                        ${
                          hasUnread
                            ? "text-slate-100 font-semibold"
                            : "text-slate-400 group-hover:text-slate-200"
                        }
                      `}
                    >
                      {lastText}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  {lastTime && (
                    <span className="text-[10px] text-slate-500 group-hover:text-slate-300 transition-colors duration-150">
                      {lastTime}
                    </span>
                  )}
                  {hasUnread && (
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function formatLastTime(ts) {
  if (!ts) return "";
  try {
    const d = ts.toDate ? ts.toDate() : ts; // Firestore Timestamp -> Date [web:420]
    if (!(d instanceof Date)) return "";

    const now = new Date();
    const sameDay =
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear();

    if (sameDay) {
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    return d.toLocaleDateString([], { day: "2-digit", month: "short" });
  } catch {
    return "";
  }
}
