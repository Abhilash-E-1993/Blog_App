// src/components/ChatLayout.jsx
export default function ChatLayout({ children }) {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* Optional: top thin strip to keep brand feel */}
      <div className="relative h-1 w-full overflow-hidden">
        <div
          className="absolute inset-0 bg-gradient-to-r from-orange-500 via-white to-green-500"
          style={{ opacity: 0.8 }}
        />
      </div>

      <main className="flex-1 flex flex-col">{children}</main>
    </div>
  );
}
