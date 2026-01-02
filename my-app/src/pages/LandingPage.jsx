import { Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#050712] text-slate-100">
      {/* Thin tricolor accent */}
      <div className="h-1.5 w-full bg-gradient-to-r from-[#ff8a3d] via-emerald-400 to-[#1ea85c]" />

      <main className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16 flex items-center">
        {/* Soft radial glow behind content */}
        <div className="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center">
          <div className="h-80 w-80 md:h-[22rem] md:w-[22rem] rounded-full bg-[radial-gradient(circle_at_center,_rgba(234,179,8,0.18),_rgba(15,23,42,0)_70%)] blur-lg" />
        </div>

        <section className="w-full flex flex-col items-center text-center gap-8 lg:gap-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2.5 rounded-full border border-orange-400/40 bg-slate-900/70 px-4 py-1.5 backdrop-blur-sm shadow-sm shadow-black/40">
            <div className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-[#ff8a3d]" />
              <span className="h-1.5 w-1.5 rounded-full bg-slate-100" />
              <span className="h-1.5 w-1.5 rounded-full bg-[#1ea85c]" />
            </div>
            <span className="text-[0.7rem] sm:text-xs font-semibold tracking-[0.22em] uppercase text-orange-200">
              Proudly Made in India
            </span>
            <Sparkles className="h-4 w-4 text-orange-300" />
          </div>

          {/* Title block */}
          <div className="max-w-3xl space-y-5 lg:space-y-6">
            <div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight">
                <span className="bg-gradient-to-r from-[#f97316] via-[#facc15] to-[#22c55e] bg-clip-text text-transparent drop-shadow-[0_0_18px_rgba(251,191,36,0.4)]">
                  BharatBlog
                </span>
              </h1>
              <div className="mt-3 flex items-center justify-center gap-3">
                <div className="h-px w-14 lg:w-20 bg-gradient-to-r from-transparent via-orange-400 to-orange-400" />
                <div className="flex gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-100" />
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                </div>
                <div className="h-px w-14 lg:w-20 bg-gradient-to-r from-emerald-400 via-emerald-400 to-transparent" />
              </div>
            </div>

            {/* Text */}
            <div className="space-y-3 lg:space-y-4">
              <p className="text-lg md:text-xl lg:text-2xl font-medium text-slate-100/90 leading-relaxed">
                Connecting every Indian voice from the heights of{" "}
                <span className="text-orange-300 font-semibold">Kashmir</span>{" "}
                to the shores of{" "}
                <span className="text-emerald-300 font-semibold">
                  Kanyakumari
                </span>
                .
              </p>
              <p className="text-base md:text-lg text-slate-300 leading-relaxed max-w-3xl mx-auto">
                Share your stories, celebrate our languages and festivals, and
                find a peaceful space where conversations stay human —{" "}
                <span className="text-emerald-300 font-semibold">
                  not controlled by foreign algorithms.
                </span>
              </p>
            </div>
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-4 sm:gap-5">
            <Link
              to="/login"
              className="inline-flex justify-center items-center px-10 py-3.5 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 text-white text-base lg:text-lg font-semibold shadow-lg shadow-orange-500/40 hover:shadow-orange-400/70 hover:-translate-y-0.5 hover:brightness-110 transition-all duration-200"
            >
              Login to BharatBlog
            </Link>

            <Link
              to="/register"
              className="inline-flex justify-center items-center px-10 py-3.5 rounded-full border border-emerald-400 text-emerald-200 text-base lg:text-lg font-semibold bg-slate-900/70 hover:bg-emerald-500/10 hover:border-emerald-300 hover:text-emerald-100 transition-all duration-200"
            >
              Create your BharatBlog account
            </Link>
          </div>

          {/* Bottom tagline */}
          <div className="pt-2 space-y-2">
            <div className="flex items-center justify-center gap-2">
              <div className="h-px w-10 sm:w-12 bg-gradient-to-r from-transparent via-orange-400 to-orange-400" />
              <span className="text-xs sm:text-sm text-slate-300">
                जय हिन्द • हर कोने की कहानी
              </span>
              <div className="h-px w-10 sm:w-12 bg-gradient-to-r from-emerald-400 via-emerald-400 to-transparent" />
            </div>
            <p className="text-[0.7rem] sm:text-xs text-slate-400">
              No foreign algorithms • No data exploitation • Stories from every
              state, every language.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
