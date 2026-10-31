/* GG Trading Footer
   Design: Violet primary CTA, blue/green accents, red ONLY in risk disclaimer
   Copy: Futures & Options focused
   Mobile: stacked CTA banner, 2-col link grid on mobile, 5-col on desktop */

import { Mail } from "lucide-react";
import { toast } from "sonner";
import logoSrc from "@/assets/gg_trading_logo.png";

const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
  </svg>
);
const DiscordIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057.1 18.08.114 18.1.132 18.11a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
  </svg>
);
const YoutubeIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
  </svg>
);
const KickIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
    <path d="M2 2h4v5.333L9.333 4H14L9.333 9.333 14 14H9.333L6 10.667V14H2V2zm10 0h4v4h2V2h4v12h-4v-4h-2v4h-4V2z" />
  </svg>
);

const socials = [
  { name: "Instagram", icon: <InstagramIcon />, color: "#E1306C", href: "https://www.instagram.com/ggstradingllc" },
  { name: "Discord",   icon: <DiscordIcon />,   color: "#5865F2", href: "https://discord.gg/npqsGfKNy" },
  { name: "YouTube",   icon: <YoutubeIcon />,   color: "#FF0000", href: "#" },
  { name: "Kick",      icon: <KickIcon />,      color: "#53FC18", href: "https://kick.com/GGTradingLLC" },
];

const footerLinks = {
  Platform:  ["Features", "Performance", "AI Signals", "Futures Trading", "Options Flow"],
  Community: ["Discord", "YouTube", "Kick", "Instagram", "Newsletter"],
  Company:   ["About", "Blog", "Careers", "Press Kit", "Contact"],
  Legal:     ["Terms of Service", "Privacy Policy", "Risk Disclosure", "Cookie Policy"],
};

export default function Footer() {
  return (
    <footer className="bg-[oklch(0.06_0.03_265)] border-t border-white/8">

      {/* CTA Banner */}
      <div className="border-b border-white/8">
        <div className="container py-10 sm:py-12">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="max-w-lg">
              <h3
                className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-2"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                Ready to trade{" "}
                <span className="gradient-text-violet-green">NQ &amp; ES Futures</span>{" "}
                with an AI edge?
              </h3>
              <p className="text-white/50 text-sm">
                Join 12,400+ traders already capturing growth in gains with GG Trading's intelligence.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto flex-shrink-0">
              <button
                className="px-6 py-3 rounded-lg bg-[oklch(0.48_0.26_292)] hover:bg-[oklch(0.55_0.26_292)] text-white font-bold text-sm cta-pulse transition-all duration-150 active:scale-[0.97] w-full sm:w-auto"
                onClick={() => toast.success("Membership signup coming soon!")}
              >
                Join Now
              </button>
              <button
                className="px-6 py-3 rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 text-white/80 font-semibold text-sm transition-all duration-150 active:scale-[0.97] w-full sm:w-auto"
                onClick={() => toast.info("Contact page coming soon!")}
              >
                Contact Us
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Grid */}
      <div className="container py-10 sm:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-10">

          {/* Brand column */}
          <div className="lg:col-span-1">
            <a href="#" className="flex items-center gap-3 mb-4">
              <img
                src={logoSrc}
                alt="GG Trading Logo"
                className="w-12 h-12 object-contain flex-shrink-0"
              />
              <div className="flex flex-col leading-none">
                <span className="text-base font-bold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  GG Trading
                </span>
                <span className="text-[9px] tracking-widest text-[oklch(0.68_0.19_162)] uppercase font-mono">
                  Growth & Gains
                </span>
              </div>
            </a>
            <p className="text-xs text-white/40 leading-relaxed mb-4">
              AI-powered Futures &amp; Options intelligence for serious index and commodities traders.
            </p>
            <a
              href="mailto:contact@ggtrading.io"
              className="flex items-center gap-2 text-xs text-white/50 hover:text-[oklch(0.68_0.19_162)] transition-colors group mb-5"
            >
              <Mail size={13} className="group-hover:text-[oklch(0.68_0.19_162)]" />
              contact@ggtrading.io
            </a>
            <div className="flex items-center gap-2.5">
              {socials.map((social) => (
                <button
                  key={social.name}
                  onClick={() => {
                    if (social.href && social.href !== "#") {
                      window.open(social.href, "_blank", "noopener,noreferrer");
                    } else {
                      toast.info(`${social.name} link coming soon!`);
                    }
                  }}
                  className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-all duration-150 active:scale-[0.95]"
                  style={{ color: social.color }}
                  title={social.name}
                >
                  {social.icon}
                </button>
              ))}
            </div>
          </div>

          {/* Link columns — 2-col on mobile, 4-col on lg */}
          <div className="lg:col-span-4 grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8">
            {Object.entries(footerLinks).map(([category, links]) => (
              <div key={category}>
                <h4
                  className="text-xs font-bold tracking-widest uppercase text-white/40 mb-3 sm:mb-4"
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  {category}
                </h4>
                <ul className="flex flex-col gap-2 sm:gap-2.5">
                  {links.map((link) => (
                    <li key={link}>
                      {link === "Terms of Service" ? (
                        <a href="/terms" className="text-xs sm:text-sm text-white/50 hover:text-white/80 transition-colors">
                          {link}
                        </a>
                      ) : (
                      <button
                        className="text-xs sm:text-sm text-white/50 hover:text-white/80 transition-colors text-left"
                        onClick={() => toast.info(`${link} page coming soon!`)}
                      >
                        {link}
                      </button>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/5">
        <div className="container py-4 sm:py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-white/25 text-center sm:text-left">
            © 2025 GG Trading — Growth & Gains Trading. Founded by Brandon Iwata. All rights reserved.
          </p>
          <p className="text-xs text-white/20 text-center sm:text-right max-w-md">
            Futures and options trading involves substantial risk of loss and is not suitable for all
            investors. Past performance is not indicative of future results.
          </p>
        </div>
      </div>
    </footer>
  );
}
