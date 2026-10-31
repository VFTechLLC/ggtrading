/* GG Trading — Terms of Service (placeholder)
   Placeholder until the real agreement is written; the signup checkbox links here. */

import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { TERMS_VERSION } from "@/lib/terms";

const sections = [
  {
    title: "Placeholder",
    body: "These Terms are a placeholder while the full agreement is prepared. The final Terms will replace this page, and members will be asked to accept them.",
  },
  {
    title: "Membership and billing",
    body: "Paid plans renew every month until you cancel. Prices are shown on the pricing section and at checkout, and sales tax is added where it applies.",
  },
  {
    title: "No refunds",
    body: "All sales are final. Subscription payments and single-item purchases are not refunded, in full or in part.",
  },
  {
    title: "Cancelling",
    body: "You can cancel any time from your account page. Your plan stays active until the end of the period you've paid for, and you won't be charged again.",
  },
  {
    title: "Not financial advice",
    body: "GG Trading provides education and trade ideas, not financial advice. Futures and options trading involves substantial risk of loss and is not suitable for all investors. Past performance is not indicative of future results.",
  },
];

export default function Terms() {
  return (
    <div className="min-h-screen bg-[oklch(0.07_0.03_265)] text-white">
      <Navbar />
      <main className="container max-w-3xl py-14 sm:py-20">
        <span className="text-xs font-mono tracking-widest uppercase text-[oklch(0.62_0.22_292)] mb-3 block">Legal</span>
        <h1 className="text-3xl sm:text-4xl font-bold mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          Terms of Service
        </h1>
        <p className="text-xs text-white/40 font-mono mb-10">Version {TERMS_VERSION}</p>
        <div className="flex flex-col gap-8">
          {sections.map((s) => (
            <section key={s.title}>
              <h2 className="text-lg font-semibold mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{s.title}</h2>
              <p className="text-white/65 leading-relaxed">{s.body}</p>
            </section>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
