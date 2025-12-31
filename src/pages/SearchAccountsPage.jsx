// src/pages/SearchAccountsPage.jsx
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";

export default function SearchAccountsPage() {
  const { currentUser } = useAuth();
  const [term, setTerm] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // simple debounce: wait 250ms after user stops typing
  const debouncedTerm = useDebouncedValue(term, 250);

  useEffect(() => {
    const runSearch = async () => {
      const qText = debouncedTerm.trim();

      // require at least 2 characters for search
      if (qText.length < 2) {
        setResults([]);
        setLoading(false);
        setError("");
        return;
      }

      try {
        setLoading(true);
        setError("");

        // normalize to lower case if you store lowercase names;
        // if not, this still gives prefix search but case-sensitive. [web:129][web:137]
        const usersRef = collection(db, "users");

        const q = query(
          usersRef,
          orderBy("name"),
          where("name", ">=", qText),
          where("name", "<=", qText + "\uf8ff"),
          limit(10)
        );

        const snap = await getDocs(q);

        if (snap.empty) {
          setResults([]);
        } else {
          const users = snap.docs.map((docSnap) => {
            const data = docSnap.data();
            const email = data.email || "";
            const name = data.name || (email ? email.split("@")[0] : "");
            const avatarUrl =
              data.avatarUrl ||
              (email
                ? `https://api.dicebear.com/7.x/bottts/png?seed=${encodeURIComponent(
                    email
                  )}`
                : "");
            return {
              id: docSnap.id,
              name,
              email,
              avatarUrl,
            };
          });
          setResults(users);
        }
      } catch (err) {
        console.error(err);
        setError("Failed to search accounts.");
      } finally {
        setLoading(false);
      }
    };

    runSearch();
  }, [debouncedTerm]);

  return (
    <div className="max-w-xl mx-auto py-6 px-4 sm:px-0">
      <h1 className="text-2xl sm:text-3xl font-bold text-slate-50 mb-3">
        Search accounts
      </h1>
      <p className="text-xs sm:text-sm text-slate-400 mb-4">
        Find people by their display name. Suggestions appear as you type.
      </p>

      <div className="mb-4">
        <input
          type="text"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="Search by name (e.g. Abhilash)"
          className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      {error && (
        <div className="mb-3 text-sm text-red-400 bg-red-950/40 border border-red-500/40 px-3 py-2 rounded-lg">
          {error}
        </div>
      )}

      {loading && (
        <div className="flex items-center gap-2 text-sm text-slate-300 mb-2">
          <div className="w-5 h-5 border-2 border-emerald-500/70 border-t-transparent rounded-full animate-spin" />
          <span>Searching accounts...</span>
        </div>
      )}

      {/* Suggestions / results */}
      {debouncedTerm.trim().length >= 2 && !loading && results.length === 0 && !error && (
        <p className="text-xs text-slate-400">
          No accounts found for “{debouncedTerm.trim()}”.
        </p>
      )}

      <div className="mt-2 space-y-2">
        {results.map((user) => {
          const isMe = currentUser?.uid === user.id;
          return (
            <Link
              key={user.id}
              to={`/u/${user.id}`}
              className="flex items-center justify-between gap-3 px-3 py-2 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-900 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full overflow-hidden border border-slate-600 bg-slate-800 flex-shrink-0">
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-[10px] text-slate-400 flex items-center justify-center">
                      No avatar
                    </span>
                  )}
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-slate-100">
                    {user.name}
                    {isMe && (
                      <span className="ml-2 text-[10px] text-emerald-400">
                        (You)
                      </span>
                    )}
                  </span>
                  {user.email && (
                    <span className="text-[11px] text-slate-400">
                      {user.email}
                    </span>
                  )}
                </div>
              </div>
              <span className="text-[11px] text-emerald-400">View profile →</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

// simple reusable debounce hook
function useDebouncedValue(value, delay) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);

  return debounced;
}
