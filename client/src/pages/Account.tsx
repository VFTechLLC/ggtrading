/* GG Trading — My account
   Plan, the Cancel button (front and center, as the owner asked), and the billing history.
   Reads the member's own rows from subscriptions and invoices, which only the Stripe webhook writes.
   Cancel and Manage billing call the billing-cancel and billing-portal functions (Stripe). */

import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { callFunction, PLAN_NAMES, supabase, type Plan } from "@/lib/supabase";
import { formatAmount } from "@shared/prices";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Link } from "wouter";

interface Subscription {
  id: string;
  plan: Exclude<Plan, "free">;
  status: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
}

interface Invoice {
  id: string;
  number: string | null;
  description: string;
  status: string;
  currency: string;
  subtotal: number;
  tax: number;
  total: number;
  payment_method: string | null;
  hosted_invoice_url: string | null;
  invoice_pdf: string | null;
  created_at: string;
}

const LIVE_STATUSES = ["active", "past_due", "trialing", "unpaid"];
const heading = { fontFamily: "'Space Grotesk', sans-serif" };
const formatDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";

export default function Account() {
  const { user, plan, openAuth } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [subs, invs] = await Promise.all([
      supabase
        .from("subscriptions")
        .select("id, plan, status, current_period_end, cancel_at_period_end")
        .in("status", LIVE_STATUSES)
        .order("created_at", { ascending: false })
        .limit(1),
      supabase
        .from("invoices")
        .select("id, number, description, status, currency, subtotal, tax, total, payment_method, hosted_invoice_url, invoice_pdf, created_at")
        .neq("status", "draft")
        .order("created_at", { ascending: false }),
    ]);
    // Until billing is set up the tables may be missing or empty; both show as "no subscription, no payments".
    setSubscription((subs.data?.[0] as Subscription | undefined) ?? null);
    setInvoices((invs.data as Invoice[] | null) ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  async function cancel() {
    if (!subscription) return;
    setBusy(true);
    try {
      await callFunction("billing-cancel", { subscription: subscription.id });
      toast.success(`Cancelled. Your ${PLAN_NAMES[subscription.plan]} plan stays active until ${formatDate(subscription.current_period_end)}.`);
      setConfirmOpen(false);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't cancel. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function manageBilling() {
    setBusy(true);
    try {
      const { url } = await callFunction<{ url: string }>("billing-portal", { returnUrl: window.location.href });
      window.location.href = url;
    } catch (err) {
      setBusy(false);
      toast.error(err instanceof Error ? err.message : "Couldn't open billing. Please try again.");
    }
  }

  return (
    <div className="min-h-screen bg-[oklch(0.07_0.03_265)] text-white">
      <Navbar />
      <main className="container max-w-4xl py-14 sm:py-20">
        <span className="text-xs font-mono tracking-widest uppercase text-[oklch(0.62_0.22_292)] mb-3 block">Account</span>
        <h1 className="text-3xl sm:text-4xl font-bold mb-8" style={heading}>
          My account
        </h1>

        {!user ? (
          <div className="gg-panel rounded-xl p-6">
            <p className="text-white/70 mb-4">Log in to see your plan, cancel, and view your billing history.</p>
            <Button className="bg-[oklch(0.48_0.26_292)] hover:bg-[oklch(0.55_0.26_292)] text-white font-semibold" onClick={() => openAuth()}>
              Log In
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            {/* Plan */}
            <section className="gg-panel rounded-xl p-6" aria-labelledby="plan-title">
              <p className="text-xs text-white/40 truncate mb-4" title={user.email}>
                Signed in as {user.email}
              </p>
              <h2 id="plan-title" className="text-sm font-bold tracking-wider uppercase text-white/60 mb-2" style={heading}>
                Your plan
              </h2>

              {loading ? (
                <p className="text-white/50">Loading…</p>
              ) : subscription ? (
                <div className="flex flex-col gap-4">
                  <div>
                    <p className="text-2xl font-bold" style={heading}>
                      {PLAN_NAMES[subscription.plan]}
                    </p>
                    <p className="text-sm text-white/60 mt-1">
                      {subscription.cancel_at_period_end
                        ? `Cancelled. Active until ${formatDate(subscription.current_period_end)}; you won't be charged again.`
                        : subscription.status === "past_due"
                          ? "Your last payment didn't go through. Update your payment method to keep your plan."
                          : `Renews ${formatDate(subscription.current_period_end)}.`}
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    {!subscription.cancel_at_period_end && (
                      <Button
                        variant="outline"
                        className="border-white/25 bg-white/5 hover:bg-white/10 text-white font-semibold"
                        disabled={busy}
                        onClick={() => setConfirmOpen(true)}
                      >
                        Cancel subscription
                      </Button>
                    )}
                    <Button variant="ghost" className="text-white/70 hover:text-white hover:bg-white/5" disabled={busy} onClick={() => void manageBilling()}>
                      {subscription.cancel_at_period_end ? "Resume or manage billing" : "Update payment method"}
                    </Button>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-2xl font-bold" style={heading}>
                    {plan ? PLAN_NAMES[plan] : "No plan yet"}
                  </p>
                  <p className="text-sm text-white/60 mt-1">
                    No paid subscription.{" "}
                    <Link href="/#pricing" className="underline text-[oklch(0.75_0.15_292)] hover:text-white">
                      See plans
                    </Link>
                  </p>
                </div>
              )}
            </section>

            {/* Billing history */}
            <section aria-labelledby="history-title">
              <h2 id="history-title" className="text-lg font-semibold mb-3" style={heading}>
                Billing history
              </h2>
              {loading ? (
                <p className="text-white/50">Loading…</p>
              ) : invoices.length === 0 ? (
                <p className="text-white/50">No payments yet.</p>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-white/10">
                  <table className="w-full text-sm">
                    <thead className="bg-white/5 text-white/60 text-left">
                      <tr>
                        <th className="px-4 py-3 font-medium">Date</th>
                        <th className="px-4 py-3 font-medium">Item</th>
                        <th className="px-4 py-3 font-medium text-right">Subtotal</th>
                        <th className="px-4 py-3 font-medium text-right">Tax</th>
                        <th className="px-4 py-3 font-medium text-right">Total</th>
                        <th className="px-4 py-3 font-medium">Paid with</th>
                        <th className="px-4 py-3 font-medium">Status</th>
                        <th className="px-4 py-3 font-medium">Receipt</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoices.map((inv) => (
                        <tr key={inv.id} className="border-t border-white/8">
                          <td className="px-4 py-3 whitespace-nowrap">{formatDate(inv.created_at)}</td>
                          <td className="px-4 py-3">{inv.description}</td>
                          <td className="px-4 py-3 text-right">{formatAmount(inv.subtotal, inv.currency)}</td>
                          <td className="px-4 py-3 text-right">{formatAmount(inv.tax, inv.currency)}</td>
                          <td className="px-4 py-3 text-right font-semibold">{formatAmount(inv.total, inv.currency)}</td>
                          <td className="px-4 py-3 whitespace-nowrap">{inv.payment_method ?? "—"}</td>
                          <td className="px-4 py-3 capitalize">{inv.status}</td>
                          <td className="px-4 py-3">
                            {inv.invoice_pdf || inv.hosted_invoice_url ? (
                              <a
                                href={inv.invoice_pdf ?? inv.hosted_invoice_url!}
                                target="_blank"
                                rel="noopener"
                                className="underline text-[oklch(0.75_0.15_292)] hover:text-white"
                              >
                                {inv.number ?? "View"}
                              </a>
                            ) : (
                              "—"
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        )}
      </main>
      <Footer />

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent className="bg-[oklch(0.10_0.04_265)] border-white/10 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle style={heading}>Cancel your {subscription ? PLAN_NAMES[subscription.plan] : ""} plan?</AlertDialogTitle>
            <AlertDialogDescription className="text-white/60">
              You keep access until {formatDate(subscription?.current_period_end ?? null)} and won't be charged again. Sales are final, so
              the current month isn't refunded.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border-white/20 text-white hover:bg-white/5">Keep my plan</AlertDialogCancel>
            <AlertDialogAction
              disabled={busy}
              onClick={(e) => {
                e.preventDefault();
                void cancel();
              }}
              className="bg-[oklch(0.48_0.26_292)] hover:bg-[oklch(0.55_0.26_292)] text-white"
            >
              Yes, cancel
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
