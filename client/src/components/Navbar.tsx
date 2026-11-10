/* GG Trading Navbar
   Design: Single ticker strip (no duplication bug), violet primary CTA
   Ticker: index futures + commodities only, no crypto
   The ticker works by rendering items ONCE and using CSS to loop them seamlessly */

import { useState, useEffect } from "react";
import logoSrc from "@/assets/gg_trading_logo.png";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/contexts/AuthContext";

// "Join Now" sends people to the plans; picking one there starts the signup.
const goToPricing = () => {
  const pricing = document.getElementById("pricing");
  if (pricing) pricing.scrollIntoView({ behavior: "smooth" });
  else window.location.href = "/#pricing";
};

const tickerItems = [
  { symbol: "NQ",   name: "Nasdaq-100", price: "21,452.50", change: "+1.36%",  up: true  },
  { symbol: "ES",   name: "S&P 500",    price: "5,892.75",  change: "+1.22%",  up: true  },
  { symbol: "YM",   name: "Dow Jones",  price: "39,512.00", change: "+0.91%",  up: true  },
  { symbol: "RTY",  name: "Russell 2K", price: "2,087.45",  change: "+1.08%",  up: true  },
  { symbol: "CL",   name: "Crude Oil",  price: "78.62",     change: "+1.75%",  up: true  },
  { symbol: "GC",   name: "Gold",       price: "2,384.60",  change: "+1.03%",  up: true  },
  { symbol: "SI",   name: "Silver",     price: "28.945",    change: "+1.71%",  up: true  },
  { symbol: "NG",   name: "Nat. Gas",   price: "2.341",     change: "-0.85%",  up: false },
  { symbol: "ZW",   name: "Wheat",      price: "548.25",    change: "-1.12%",  up: false },
  { symbol: "VIX",  name: "Volatility", price: "15.82",     change: "-3.67%",  up: false },
  { symbol: "TNX",  name: "10Y Yield",  price: "4.312",     change: "+0.04%",  up: true  },
  { symbol: "DXY",  name: "US Dollar",  price: "104.23",    change: "+0.18%",  up: true  },
];

const navLinks = [
  { label: "Features",    href: "/#features",    external: false },
  { label: "Performance", href: "/#performance", external: false },
  { label: "Streams",     href: "/streams",      external: false },
  { label: "Community",   href: "/#community",   external: false },
  { label: "Pricing",     href: "/#pricing",     external: false },
  { label: "Contact",     href: "/#contact",     external: false },
];

export default function Navbar() {
  const [scrolled, setScrolled]     = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, openAuth, signOut } = useAuth();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <>
      {/* ── Single Ticker Strip ──
          We render the items twice inside ONE .ticker-track div.
          The CSS animation moves the track left by exactly 50% (= one copy width),
          then loops — creating a seamless infinite scroll with NO overlap. */}
      <div
        className="w-full overflow-hidden bg-[oklch(0.08_0.04_265)] border-b border-white/5 py-1.5 select-none"
        aria-hidden="true"
      >
        <div className="ticker-track whitespace-nowrap">
          {/* First copy */}
          {tickerItems.map((item, i) => (
            <span key={`a-${i}`} className="inline-flex items-center gap-1.5 text-xs font-mono mr-8">
              <span className="text-[oklch(0.62_0.22_292)] font-bold">{item.symbol}</span>
              <span className="text-white/40 text-[10px]">{item.name}</span>
              <span className="text-white/75">{item.price}</span>
              <span className={item.up ? "text-[oklch(0.68_0.19_162)]" : "text-[oklch(0.60_0.24_22)]"}>
                {item.change}
              </span>
            </span>
          ))}
          {/* Second copy — seamless loop */}
          {tickerItems.map((item, i) => (
            <span key={`b-${i}`} className="inline-flex items-center gap-1.5 text-xs font-mono mr-8">
              <span className="text-[oklch(0.62_0.22_292)] font-bold">{item.symbol}</span>
              <span className="text-white/40 text-[10px]">{item.name}</span>
              <span className="text-white/75">{item.price}</span>
              <span className={item.up ? "text-[oklch(0.68_0.19_162)]" : "text-[oklch(0.60_0.24_22)]"}>
                {item.change}
              </span>
            </span>
          ))}
        </div>
      </div>

      {/* ── Main Nav ── */}
      <header
        className={`sticky top-0 z-50 w-full transition-all duration-300 ${
          scrolled
            ? "bg-[oklch(0.07_0.03_265)]/95 backdrop-blur-xl border-b border-white/8 shadow-lg shadow-black/30"
            : "bg-[oklch(0.07_0.03_265)]/80 backdrop-blur-md border-b border-white/5"
        }`}
      >
        <div className="container flex items-center justify-between h-16">
          {/* Logo */}
          <a href="#" className="flex items-center gap-3 group">
            <img
              src={logoSrc}
              alt="GG Trading Logo"
              className="w-10 h-10 object-contain"
            />
            <div className="flex flex-col leading-none">
              <span className="text-lg font-bold tracking-tight text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                GG Trading
              </span>
              <span className="text-[10px] tracking-widest text-[oklch(0.68_0.19_162)] uppercase font-mono">
                Growth & Gains
              </span>
            </div>
          </a>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-7">
            {navLinks.map((link) => (
              <Link key={link.label} href={link.href} className="nav-link text-sm font-medium">
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop CTA — violet primary */}
          <div className="hidden md:flex items-center gap-3">
            {user && (
              <Link href="/account" className="text-xs text-white/60 hover:text-white max-w-[160px] truncate" title={user.email}>
                My account
              </Link>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="text-white/70 hover:text-white hover:bg-white/5"
              onClick={() => (user ? void signOut() : openAuth())}
            >
              {user ? "Log Out" : "Log In"}
            </Button>
            <Button
              size="sm"
              className="cta-pulse bg-[oklch(0.48_0.26_292)] hover:bg-[oklch(0.55_0.26_292)] text-white font-semibold px-5 transition-all duration-150 active:scale-[0.97]"
              onClick={goToPricing}
            >
              Join Now
            </Button>
          </div>

          {/* Mobile Toggle */}
          <button
            className="md:hidden text-white/70 hover:text-white p-2"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="md:hidden bg-[oklch(0.10_0.04_265)] border-t border-white/8 px-4 py-4 flex flex-col gap-3">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-sm text-white/70 hover:text-white py-2 border-b border-white/5"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            {user && (
              <Link
                href="/account"
                className="text-sm text-white/70 hover:text-white py-2 border-b border-white/5"
                onClick={() => setMobileOpen(false)}
              >
                My account
              </Link>
            )}
            <Button
              variant="outline"
              className="mt-2 border-white/20 bg-white/5 text-white"
              onClick={() => { setMobileOpen(false); if (user) void signOut(); else openAuth(); }}
            >
              {user ? `Log Out (${user.email})` : "Log In"}
            </Button>
            <Button
              className="bg-[oklch(0.48_0.26_292)] hover:bg-[oklch(0.55_0.26_292)] text-white font-semibold"
              onClick={() => { setMobileOpen(false); goToPricing(); }}
            >
              Join Now
            </Button>
          </div>
        )}
      </header>
    </>
  );
}
