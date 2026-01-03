// src/components/ChatLayout.jsx
export default function ChatLayout({ children }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col">
      {/* top brand strip with glow */}
      <div className="relative h-1 w-full overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 via-orange-400 to-emerald-500 opacity-80" />
        <div className="absolute inset-0 blur-sm bg-gradient-to-r from-emerald-500/40 via-orange-400/40 to-emerald-500/40" />
      </div>

      {/* main chat shell */}
      <main className="flex-1 flex justify-center">
        <div className="w-full max-w-6xl flex flex-col">
          {children}
        </div>
      </main>
    </div>
  );
}
