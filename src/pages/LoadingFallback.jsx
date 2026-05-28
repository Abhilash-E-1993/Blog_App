export default function LoadingFallback() {
  return (
    <>
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-150%) skewX(-12deg); }
          100% { transform: translateX(300%) skewX(-12deg); }
        }
        @keyframes ping-slow {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.4); opacity: 0; }
        }
        @keyframes blob-pulse {
          0%, 100% { transform: scale(1); opacity: 0.15; }
          50% { transform: scale(1.1); opacity: 0.25; }
        }
        @keyframes dot-bounce {
          0%, 100% { transform: translateY(0); opacity: 0.4; }
          50% { transform: translateY(-8px); opacity: 1; }
        }
      `}</style>

      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#020617",
        overflow: "hidden",
        position: "relative",
        fontFamily: "sans-serif",
      }}>

        {/* Glow blobs */}
        <div style={{
          position: "absolute",
          width: "400px", height: "400px",
          background: "radial-gradient(circle, rgba(16,185,129,0.15), transparent 70%)",
          borderRadius: "50%",
          top: "20%", left: "30%",
          animation: "blob-pulse 4s ease-in-out infinite",
        }} />
        <div style={{
          position: "absolute",
          width: "300px", height: "300px",
          background: "radial-gradient(circle, rgba(20,184,166,0.12), transparent 70%)",
          borderRadius: "50%",
          bottom: "20%", right: "30%",
          animation: "blob-pulse 4s ease-in-out 2s infinite",
        }} />

        {/* Center content */}
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "28px",
          zIndex: 10,
        }}>

          {/* Logo box with ping */}
          <div style={{ position: "relative", width: "64px", height: "64px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{
              position: "absolute",
              width: "64px", height: "64px",
              borderRadius: "16px",
              border: "2px solid rgba(16,185,129,0.4)",
              animation: "ping-slow 2s ease-in-out infinite",
            }} />
            <div style={{
              width: "56px", height: "56px",
              borderRadius: "14px",
              background: "rgba(16,185,129,0.08)",
              border: "1px solid rgba(16,185,129,0.35)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backdropFilter: "blur(8px)",
            }}>
              <span style={{ color: "#34d399", fontWeight: "800", fontSize: "26px" }}>B</span>
            </div>
          </div>

          {/* Brand name with shimmer */}
          <div style={{ position: "relative", overflow: "hidden" }}>
            <h1 style={{
              margin: 0,
              fontSize: "22px",
              fontWeight: "700",
              letterSpacing: "0.3em",
              color: "#cbd5e1",
            }}>
              BHARATBLOG
            </h1>
            <div style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)",
              animation: "shimmer 2.5s ease-in-out infinite",
            }} />
          </div>

          {/* Staggered dot loader */}
          <div style={{ display: "flex", gap: "8px" }}>
            {[0, 1, 2, 3].map((i) => (
              <div key={i} style={{
                width: "7px", height: "7px",
                borderRadius: "50%",
                backgroundColor: "#34d399",
                animation: `dot-bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
              }} />
            ))}
          </div>

        </div>
      </div>
    </>
  )
}