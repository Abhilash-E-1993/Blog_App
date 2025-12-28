// src/components/MainLayout.jsx
import Navbar from "./Navbar";

export default function MainLayout({ children }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-6 sm:py-8">
        {children}
      </main>
    </div>
  );
}
