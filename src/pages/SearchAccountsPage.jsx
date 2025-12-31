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

  const debouncedTerm = useDebouncedValue(term, 250);

  const trimmed = debouncedTerm.trim();
  const canSearch = trimmed.length >= 2;

  useEffect(() => {
    const runSearch = async () => {
      const qText = trimmed;

      if (!canSearch) {
        setResults([]);
        setLoading(false);
        setError("");
        return;
      }

      try {
        setLoading(true);
        setError("");

        const usersRef = collection(db, "users");

        const q = query(
          usersRef,
          orderBy("name"),
          where("name", ">=", qText),
          where("name", "<=", qText + "\uf8ff"),
          limit(10)
        ); // prefix search pattern [web:31]

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
  }, [trimmed, canSearch]);

  const placeholderText = useMemo(() => {
    if (!currentUser?.email) return "Search by name (e.g. Abhilash)";
    const base = currentUser.email.split("@")[0];
    return `Search by name (e.g. ${base})`;
  }, [currentUser?.email]);

  return (
    <div className="max-w-xl mx-auto py-6 px-4 sm:px-0">
      <div className="mb-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-50">
          Search accounts
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Find people by their display name. Live suggestions appear as you type.
        </p>
      </div>

      <div className="mb-4">
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-4.35-4.35M5 11a6 6 0 1112 0 6 6 0 01-12 0z"
              />
            </svg>
          </span>
          <input
            type="text"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder={placeholderText}
            className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-9 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
          />
          {term && (
            <button
              type="button"
              onClick={() => {
                setTerm("");
                setResults([]);
                setError("");
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
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
        <p className="mt-1 text-[10px] text-slate-500">
          Type at least 2 characters to start searching.
        </p>
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

      {!loading && !error && !canSearch && term.trim().length > 0 && (
        <p className="text-xs text-slate-400">
          Keep typing to see matching accounts.
        </p>
      )}

      {canSearch && !loading && results.length === 0 && !error && (
        <p className="text-xs text-slate-400">
          No accounts found for “{trimmed}”.
        </p>
      )}

      <div className="mt-3 space-y-2">
        {results.map((user) => {
          const isMe = currentUser?.uid === user.id;
          return (
            <Link
              key={user.id}
              to={`/u/${user.id}`}
              className="group flex items-center justify-between gap-3 px-3 py-2.5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500/60 hover:bg-slate-900 shadow-sm hover:shadow-[0_8px_24px_rgba(15,23,42,0.9)] transition-all"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative h-9 w-9 rounded-full overflow-hidden border border-slate-600 bg-slate-800 flex-shrink-0">
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-[11px] font-semibold text-slate-300">
                      {user.name?.[0]?.toUpperCase() || "U"}
                    </div>
                  )}
                  {isMe && (
                    <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 border-2 border-slate-900" />
                  )}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-medium text-slate-100 truncate max-w-[180px] sm:max-w-[220px]">
                    {user.name}
                    {isMe && (
                      <span className="ml-1.5 text-[10px] text-emerald-400">
                        (You)
                      </span>
                    )}
                  </span>
                  {user.email && (
                    <span className="text-[11px] text-slate-400 truncate max-w-[200px] sm:max-w-[240px]">
                      {user.email}
                    </span>
                  )}
                </div>
              </div>
              <span className="text-[11px] text-emerald-400 opacity-0 group-hover:opacity-100 translate-x-1 group-hover:translate-x-0 transition-all">
                View profile →
              </span>
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
