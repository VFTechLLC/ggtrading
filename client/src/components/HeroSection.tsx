/* GG Trading Hero Section
   Design: generated monitor-wall hero (MNQ 5m candles, white MA arc, EMA ribbon,
   trade boxes, DOM) in a cinematic violet nebula; see scripts/hero/gen.py. No bull. No crypto.
   Frosted glass panel left-aligned — 65% opacity, 20px blur, darker background.
   Copy uses Brandon's authentic teaching voice: FVG, EMA, ORB, micro contracts.
   "See Our Results" scrolls to #performance. */

import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { TrendingUp, Zap, BarChart2 } from "lucide-react";

// Served from client/public so it can't vanish with a third-party host again.
// Regenerate with: python3 scripts/hero/gen.py client/public/gg_hero.webp 23
const HERO_IMAGE = "/gg_hero.webp";

const stats = [
  { label: "Win Rate",          value: "78.4%",         color: "text-[oklch(0.68_0.19_162)]" },
  { label: "Avg. Monthly Gain", value: "+34.7%",        color: "text-[oklch(0.68_0.19_162)]" },
  { label: "Active Members",    value: "12,400+",       color: "text-[oklch(0.62_0.22_292)]" },
  { label: "Instruments",       value: "NQ · ES · CL · GC", color: "text-[oklch(0.78_0.17_80)]" },
];

export default function HeroSection() {
  const { join } = useAuth();
  const scrollToPerformance = () => {
    document.getElementById("performance")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative w-full min-h-[88vh] sm:min-h-[92vh] flex items-center overflow-hidden">

      {/* ── Background image — full crisp quality ── */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${HERO_IMAGE})` }}
      />

      {/* Dark atmospheric overlay — dims the image without muddying it.
          Radial vignette darkens edges, left gradient creates contrast zone for text panel */}
      <div
        className="absolute inset-0"
        style={{
          background: [
            /* Overall dark veil — pushes image to background */
            "linear-gradient(to bottom, oklch(0.04 0.04 265 / 52%) 0%, oklch(0.04 0.04 265 / 38%) 60%, oklch(0.04 0.04 265 / 72%) 100%)",
          ].join(", "),
          zIndex: 2,
        }}
      />
      {/* Left-side deeper shadow — extra depth behind the text panel */}
      <div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(ellipse 70% 100% at 0% 50%, oklch(0.04 0.05 265 / 60%) 0%, transparent 70%)",
          zIndex: 3,
        }}
      />

      {/* Bottom fade into next section */}
      <div
        className="absolute bottom-0 left-0 right-0 h-36"
        style={{ background: "linear-gradient(to bottom, transparent, oklch(0.07 0.03 265))", zIndex: 3 }}
      />

      {/* ── Content ── */}
      <div className="container relative py-16 sm:py-20 lg:py-28" style={{ zIndex: 5 }}>
        {/* Frosted glass panel — 65% opacity, darker, more frosted */}
        <div className="hero-glass w-full max-w-[580px] p-6 sm:p-8 lg:p-10">

          {/* Live badge */}
          <div className="fade-up fade-up-delay-1 inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[oklch(0.48_0.26_292)/50%] bg-[oklch(0.48_0.26_292)/15%] mb-4 sm:mb-5">
            <span className="w-2 h-2 rounded-full bg-[oklch(0.62_0.22_292)] animate-pulse" />
            <span className="text-[10px] sm:text-xs font-mono text-[oklch(0.75_0.18_292)] tracking-wider uppercase">
              AI-Powered Futures &amp; Options Intelligence
            </span>
          </div>

          {/* Headline */}
          <h1
            className="fade-up fade-up-delay-2 text-3xl sm:text-4xl lg:text-6xl font-extrabold leading-[1.05] tracking-tight text-white mb-3"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            Growth & Gains.
            <br />
            <span className="gradient-text-violet-green">Every Session.</span>
          </h1>

          {/* Sub-headline — Brandon's authentic voice */}
          <p className="fade-up fade-up-delay-3 text-sm sm:text-base lg:text-lg text-white/85 leading-relaxed mb-5 sm:mb-6">
            We trade <strong className="text-white">MNQ and MES micro futures</strong> using{" "}
            <strong className="text-[oklch(0.68_0.19_162)]">Fair Value Gaps</strong>,{" "}
            <strong className="text-[oklch(0.68_0.19_162)]">EMA crossovers</strong>, and the{" "}
            <strong className="text-[oklch(0.68_0.19_162)]">6:30 AM Opening Range Breakout</strong> —
            high-probability setups with a minimum <strong className="text-white">2:1 risk/reward</strong> on every trade.
          </p>

          {/* Feature pills */}
          <div className="fade-up fade-up-delay-4 flex flex-wrap gap-2 sm:gap-2.5 mb-6 sm:mb-7">
            {[
              { icon: <Zap size={12} />,       label: "FVG & EMA Signals" },
              { icon: <TrendingUp size={12} />, label: "Opening Range Breakout" },
              { icon: <BarChart2 size={12} />,  label: "NQ · ES · Gold" },
            ].map((pill) => (
              <span
                key={pill.label}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-white/8 border border-white/12 text-xs sm:text-sm text-white/85 font-medium"
              >
                <span className="text-[oklch(0.62_0.22_292)]">{pill.icon}</span>
                {pill.label}
              </span>
            ))}
          </div>

          {/* CTAs */}
          <div className="fade-up fade-up-delay-5 flex flex-col sm:flex-row gap-3">
            <Button
              size="lg"
              className="cta-pulse bg-[oklch(0.48_0.26_292)] hover:bg-[oklch(0.55_0.26_292)] text-white font-bold text-sm sm:text-base px-6 sm:px-7 py-4 sm:py-5 rounded-lg transition-all duration-150 active:scale-[0.97] w-full sm:w-auto"
              onClick={() => void join("free")}
            >
              Join the Community
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white/25 bg-white/8 hover:bg-white/14 text-white font-semibold text-sm sm:text-base px-6 sm:px-7 py-4 sm:py-5 rounded-lg transition-all duration-150 active:scale-[0.97] w-full sm:w-auto"
              onClick={scrollToPerformance}
            >
              See Our Results ↓
            </Button>
          </div>
        </div>
      </div>

      {/* ── Stats bar ── */}
      <div className="absolute bottom-6 sm:bottom-8 left-0 right-0" style={{ zIndex: 5 }}>
        <div className="container">
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-x-6 sm:gap-x-8 gap-y-3 max-w-3xl">
            {stats.map((stat) => (
              <div key={stat.label} className="flex flex-col">
                <span className={`text-base sm:text-xl font-bold font-mono ${stat.color}`}>{stat.value}</span>
                <span className="text-[10px] sm:text-xs text-white/45 mt-0.5">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
