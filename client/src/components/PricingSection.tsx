/* GG Trading Pricing / Membership Section
   Design: Three-tier — violet highlight on Pro, blue on Elite
   Red is NOT used on any CTA or plan highlight — only on loss/risk labels
   Mobile: single column stacked, full-width cards */

import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { formatAmount, planPrice } from "@shared/prices";
import { Check, Zap } from "lucide-react";

const plans = [
  {
    id: "free" as const,
    name: "Free",
    price: formatAmount(planPrice("free").amount),
    period: "/month",
    tagline: "Start learning the system",
    features: [
      "Public Discord access",
      "Weekly market newsletter",
      "Intro to FVG & EMA strategy",
      "YouTube trade review library",
      "TradingView setup guide",
    ],
    cta: "Get Started Free",
    highlight: false,
    elite: false,
    panelStyle: "gg-panel",
    ctaClass: "border-white/20 bg-white/5 hover:bg-white/10 text-white",
    checkColor: "text-[oklch(0.68_0.19_162)]",
  },
  {
    id: "pro" as const,
    name: "Pro",
    price: formatAmount(planPrice("pro").amount),
    period: "/month",
    tagline: "For serious futures traders",
    badge: "Most Popular",
    features: [
      "Everything in Free",
      "Live MNQ & MES signal alerts",
      "FVG + ORB setup notifications",
      "EMA crossover entry/exit alerts",
      "Private Discord signal channels",
      "Live Kick & YouTube sessions",
      "Micro contract sizing guidance",
      "2:1 risk/reward trade plans",
    ],
    cta: "Join Pro",
    highlight: true,
    elite: false,
    panelStyle: "",
    ctaClass: "bg-[oklch(0.48_0.26_292)] hover:bg-[oklch(0.55_0.26_292)] text-white font-bold cta-pulse",
    checkColor: "text-[oklch(0.62_0.22_292)]",
  },
  {
    id: "elite" as const,
    name: "Elite",
    price: formatAmount(planPrice("elite").amount),
    period: "/month",
    tagline: "Trade alongside Brandon",
    features: [
      "Everything in Pro",
      "1-on-1 sessions with Brandon (monthly)",
      "Pre-market NQ/ES bias briefing (daily)",
      "Bar Replay session recordings",
      "Priority signal delivery",
      "Exclusive Elite Discord tier",
      "Prop firm evaluation guidance",
      "White-glove onboarding",
    ],
    cta: "Join Elite",
    highlight: false,
    elite: true,
    panelStyle: "gg-panel-blue",
    ctaClass: "border-[oklch(0.50_0.22_258)/50%] bg-[oklch(0.50_0.22_258)/10%] hover:bg-[oklch(0.50_0.22_258)/20%] text-[oklch(0.80_0.15_258)]",
    checkColor: "text-[oklch(0.65_0.18_258)]",
  },
];

export default function PricingSection() {
  const { join, plan: currentPlan } = useAuth();

  return (
    <section id="pricing" className="py-16 sm:py-24 relative bg-[oklch(0.09_0.03_265)]">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[oklch(0.48_0.26_292)/40%] to-transparent" />
      <div className="absolute inset-0 neural-grid opacity-10" />

      <div className="container relative z-10">
        <div className="text-center mb-10 sm:mb-16 max-w-2xl mx-auto">
          <span className="text-xs font-mono tracking-widest uppercase text-[oklch(0.62_0.22_292)] mb-3 block">
            Membership
          </span>
          <h2
            className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight mb-4"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            Choose Your
            <br />
            <span className="gradient-text-violet-blue">Trading Edge</span>
          </h2>
          <p className="text-white/60 text-base sm:text-lg leading-relaxed">
            Transparent pricing. No hidden fees. Cancel anytime.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 sm:gap-6 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative flex flex-col rounded-xl p-5 sm:p-6 transition-all duration-300 ${
                plan.highlight
                  ? "bg-[oklch(0.13_0.05_292)] border-2 border-[oklch(0.48_0.26_292)/60%] shadow-[0_0_40px_oklch(0.48_0.26_292/20%)]"
                  : plan.panelStyle
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-[oklch(0.48_0.26_292)] text-white font-mono tracking-wide whitespace-nowrap">
                    {plan.badge}
                  </span>
                </div>
              )}

              <div className="mb-5 sm:mb-6">
                <div className="flex items-center gap-2 mb-1">
                  {plan.highlight && <Zap size={14} className="text-[oklch(0.62_0.22_292)]" />}
                  <span className="text-sm font-bold tracking-wider uppercase text-white/70" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                    {plan.name}
                  </span>
                </div>
                <div className="flex items-baseline gap-1 mt-2">
                  <span className="text-3xl sm:text-4xl font-extrabold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                    {plan.price}
                  </span>
                  <span className="text-white/40 text-sm">{plan.period}</span>
                </div>
                <p className="text-xs text-white/50 mt-1">{plan.tagline}</p>
              </div>

              <div className="h-px bg-white/8 mb-4 sm:mb-5" />

              <ul className="flex flex-col gap-2 sm:gap-2.5 mb-6 sm:mb-8 flex-1">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 sm:gap-2.5 text-xs sm:text-sm text-white/70">
                    <Check size={13} className={`flex-shrink-0 mt-0.5 ${plan.checkColor}`} />
                    {feature}
                  </li>
                ))}
              </ul>

              <Button
                className={`w-full font-semibold transition-all duration-150 active:scale-[0.97] ${plan.ctaClass}`}
                variant={plan.highlight || plan.elite ? "default" : "outline"}
                onClick={() => void join(plan.id)}
              >
                {currentPlan === plan.id ? "Your plan" : plan.cta}
              </Button>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-white/30 mt-6 sm:mt-8">
          Sales are final. Cancel anytime from your account page; your plan runs to the end of the paid month.
        </p>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[oklch(0.68_0.19_162)/30%] to-transparent" />
    </section>
  );
}
