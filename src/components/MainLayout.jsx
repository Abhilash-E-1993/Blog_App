// src/components/MainLayout.jsx
import Navbar from "./Navbar";

export default function MainLayout({ children }) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* global tricolor glow behind everything */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_top,_rgba(249,115,22,0.18)_0,_transparent_55%),radial-gradient(circle_at_bottom,_rgba(34,197,94,0.18)_0,_transparent_55%)]" />
      </div>

      <Navbar />

      <main className="max-w-5xl mx-auto px-3 sm:px-4 lg:px-6 py-6 sm:py-8">
        {children}
      </main>
    </div>
  );
}
