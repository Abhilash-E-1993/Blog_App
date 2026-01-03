// src/context/ChatUnreadContext.jsx
import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import { subscribeToConversations } from "../lib/chat";

const ChatUnreadContext = createContext({ unreadCount: 0 });

export function ChatUnreadProvider({ children }) {
  const { currentUser } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!currentUser?.uid) {
      setUnreadCount(0);
      return undefined;
    }

    const userId = currentUser.uid;

    const unsubscribe = subscribeToConversations(
      userId,
      (convs) => {
        const count = (convs || []).filter((c) => {
          const arr = Array.isArray(c.unreadFor) ? c.unreadFor : [];
          return arr.includes(userId);
        }).length;
        setUnreadCount(count);
      },
      () => {
        setUnreadCount(0);
      }
    );

    return () => {
      if (typeof unsubscribe === "function") {
        unsubscribe();
      }
    };
  }, [currentUser?.uid]);

  return (
    <ChatUnreadContext.Provider value={{ unreadCount }}>
      {children}
    </ChatUnreadContext.Provider>
  );
}

export function useChatUnread() {
  return useContext(ChatUnreadContext);
}
