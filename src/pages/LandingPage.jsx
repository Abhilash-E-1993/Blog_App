import { Sparkles, Users, Heart, MapPin } from "lucide-react";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

export default function LandingPage() {
  const [stars, setStars] = useState([]);

  useEffect(() => {
    const starInterval = setInterval(() => {
      const newStar = {
        id: Math.random(),
        left: Math.random() * 100,
        top: Math.random() * 40,
        duration: 1.5 + Math.random() * 1,
        delay: Math.random() * 0.3,
      };
      setStars((prev) => [...prev, newStar]);

      setTimeout(() => {
        setStars((prev) => prev.filter((s) => s.id !== newStar.id));
      }, (newStar.duration + newStar.delay) * 1000 + 100);
    }, 2500);

    return () => clearInterval(starInterval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100 overflow-hidden relative">
      {/* Animated tricolor strip */}
      <div className="relative h-1.5 w-full overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-orange-500 via-white to-green-500 animate-pulse" />
        <div className="absolute inset-0 bg-gradient-to-r from-orange-400/50 via-white/50 to-green-400/50 blur-sm" />
      </div>

      {/* Subtle shooting stars */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {/* Gentle twinkling stars */}
        {[...Array(60)].map((_, i) => (
          <div
            key={`static-${i}`}
            className="absolute rounded-full bg-white"
            style={{
              width: Math.random() * 2 + 0.5 + "px",
              height: Math.random() * 2 + 0.5 + "px",
              left: Math.random() * 100 + "%",
              top: Math.random() * 100 + "%",
              opacity: Math.random() * 0.3 + 0.1,
              animation: `twinkle ${Math.random() * 4 + 3}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 4}s`,
            }}
          />
        ))}

        {/* Elegant shooting stars */}
        {stars.map((star) => (
          <div
            key={star.id}
            className="absolute"
            style={{
              left: `${star.left}%`,
              top: `${star.top}%`,
              animation: `shoot ${star.duration}s ease-out forwards`,
              animationDelay: `${star.delay}s`,
            }}
          >
            <div className="relative w-20 h-1">
              <div
                className="absolute right-0 w-3 h-3 rounded-full bg-white"
                style={{
                  boxShadow:
                    "0 0 12px 3px rgba(255, 255, 255, 0.6), 0 0 20px 5px rgba(251, 191, 36, 0.4)",
                }}
              />
              <div
                className="absolute right-0 top-1/2 -translate-y-1/2 h-full w-full rounded-l-full"
                style={{
                  background:
                    "linear-gradient(to left, rgba(255, 255, 255, 0.6), rgba(251, 191, 36, 0.3), transparent)",
                }}
              />
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        @keyframes twinkle {
          0%,
          100% {
            opacity: 0.1;
          }
          50% {
            opacity: 0.4;
          }
        }
        @keyframes shoot {
          0% {
            transform: translate(0, 0) rotate(-45deg);
            opacity: 1;
          }
          100% {
            transform: translate(200px, 200px) rotate(-45deg);
            opacity: 0;
          }
        }
      `}</style>

      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14 min-h-screen flex items-center justify-center">
        {/* Elegant floating orbs */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-[10%] top-[15%] h-80 w-80 rounded-full bg-gradient-to-br from-orange-500/15 via-orange-400/8 to-transparent blur-3xl animate-pulse" />
          <div
            className="absolute right-[15%] top-[25%] h-72 w-72 rounded-full bg-gradient-to-bl from-green-500/15 via-green-400/8 to-transparent blur-3xl animate-pulse"
            style={{ animationDelay: "1s" }}
          />
          <div
            className="absolute left-[20%] bottom-[20%] h-64 w-64 rounded-full bg-gradient-to-tr from-blue-500/12 via-blue-400/6 to-transparent blur-3xl animate-pulse"
            style={{ animationDelay: "2s" }}
          />
        </div>

        <section className="relative flex flex-col items-center justify-center text-center space-y-10 w-full">
          {/* Badge */}
          <div className="inline-flex items-center gap-2.5 rounded-full border border-orange-500/30 bg-gradient-to-r from-orange-500/15 via-green-500/10 to-transparent px-5 py-2.5 backdrop-blur-sm">
            <div className="flex items-center gap-1">
              <div className="h-1.5 w-1.5 rounded-full bg-orange-500" />
              <div className="h-1.5 w-1.5 rounded-full bg-white" />
              <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
            </div>
            <span className="text-xs font-semibold tracking-[0.25em] uppercase text-orange-300">
              Proudly Made in India
            </span>
            <Sparkles className="h-4 w-4 text-orange-400" />
          </div>

          {/* Center: BharatBlog title block */}
          <div className="space-y-8 max-w-5xl relative">
            {/* Glow behind text */}
            <div className="absolute inset-0 flex items-center justify-center opacity-40 translate-y-2">
              <div className="h-44 w-full rounded-full bg-gradient-to-r from-orange-500/30 via-yellow-400/30 to-green-500/30 blur-3xl animate-pulse" />
            </div>

            {/* Main logo text – adjusted line-height so 'g' is not clipped, slightly moved up */}
            <div className="relative -translate-y-2">
              <h1
                className="font-black leading-none"
                style={{
                  fontSize: "clamp(3.5rem, 11vw, 7rem)",
                  letterSpacing: "-0.02em",
                  lineHeight: 1.05, // more vertical room so descenders like 'g' are visible
                }}
              >
                <span
                  className="inline-block text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-yellow-300 to-green-400"
                  style={{
                    textShadow:
                      "0 0 50px rgba(251, 191, 36, 0.5), 0 0 60px rgba(34, 197, 94, 0.35)",
                    filter:
                      "drop-shadow(0 0 22px rgba(251, 146, 60, 0.6)) drop-shadow(0 0 30px rgba(34, 197, 94, 0.4))",
                    WebkitFontSmoothing: "antialiased",
                    MozOsxFontSmoothing: "grayscale",
                  }}
                >
                  BharatBlog
                </span>
              </h1>

              {/* Decorative line under logo */}
              <div className="flex items-center justify-center gap-3 mt-3">
                <div className="h-1 w-20 bg-gradient-to-r from-transparent via-orange-500 to-orange-500 rounded-full" />
                <div className="flex gap-1.5">
                  <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" />
                  <div
                    className="w-2 h-2 bg-white rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  />
                  <div
                    className="w-2 h-2 bg-green-500 rounded-full animate-bounce"
                    style={{ animationDelay: "0.4s" }}
                  />
                </div>
                <div className="h-1 w-20 bg-gradient-to-r from-green-500 via-green-500 to-transparent rounded-full" />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-4">
              <p className="text-xl sm:text-2xl lg:text-3xl text-slate-200 font-medium leading-relaxed max-w-4xl mx-auto">
                Connecting every Indian voice from the heights of{" "}
                <span className="text-orange-400 font-bold">Kashmir</span> to
                the shores of{" "}
                <span className="text-green-400 font-bold">Kanyakumari</span>.
              </p>
              <p className="text-lg sm:text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed">
                Share your stories, celebrate our diversity, and connect
                authentically—{" "}
                <span className="text-green-400 font-semibold">
                  all without algorithmic chaos
                </span>
                .
              </p>
            </div>
          </div>

          {/* CTA Buttons – now clearly above the fold */}
          <div className="flex flex-wrap items-center justify-center gap-5 pt-1">
            <Link
              to="/login"
              className="group relative px-10 py-4 rounded-full bg-gradient-to-r from-orange-500 via-orange-600 to-orange-500 text-white text-lg font-bold shadow-2xl shadow-orange-500/50 hover:shadow-orange-500/70 hover:scale-110 transition-all duration-300 overflow-hidden"
            >
              <span className="relative z-10">Login to BharatBlog</span>
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-orange-400 to-yellow-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-yellow-400 opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-300" />
            </Link>

            <Link
              to="/register"
              className="px-10 py-4 rounded-full border-2 border-slate-600 text-slate-100 text-lg font-semibold hover:border-green-500 hover:text-green-400 hover:bg-green-500/10 hover:scale-105 transition-all duration-300"
            >
              Create your BharatBlog account
            </Link>
          </div>

          {/* Bottom tagline */}
          <div className="pt-6 space-y-3">
            <div className="flex items-center justify-center gap-2">
              <div className="h-px w-12 bg-gradient-to-r from-transparent via-orange-500 to-orange-500" />
              <span className="text-sm text-slate-500">जय हिन्द</span>
              <div className="h-px w-12 bg-gradient-to-r from-green-500 via-green-500 to-transparent" />
            </div>
            <p className="text-xs text-slate-600">
              No foreign algorithms • No data exploitation • Pure authenticity
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
