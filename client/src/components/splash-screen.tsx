import { useState, useEffect } from "react";

export function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => setFadeOut(true), 2200);
    const completeTimer = setTimeout(() => onComplete(), 2800);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-gradient-to-br from-blue-600 via-blue-700 to-cyan-600 transition-opacity duration-500 ${
        fadeOut ? "opacity-0" : "opacity-100"
      }`}
      data-testid="splash-screen"
    >
      <div className="flex flex-col items-center gap-6 animate-[fadeInUp_0.8s_ease-out]">
        <div className="w-24 h-24 rounded-3xl bg-white/15 backdrop-blur-sm flex items-center justify-center shadow-2xl animate-[pulse_2s_ease-in-out_infinite]">
          <img src="/logo.png" alt="NetScope" className="w-16 h-16" />
        </div>
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white tracking-tight">NetScope</h1>
          <p className="text-sm text-white/70 mt-1.5 font-medium">Smart Network Toolkit</p>
        </div>
      </div>
      <div className="absolute bottom-12 text-center">
        <p className="text-xs text-white/50">Powered by</p>
        <p className="text-sm font-semibold text-white/80 mt-0.5">Sudais Tech</p>
      </div>
    </div>
  );
}
