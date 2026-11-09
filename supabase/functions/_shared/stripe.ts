// Stripe for GG Trading billing (spec approved 2026-10-31): hosted Checkout to subscribe, the hosted Customer Portal to
// update a card or see invoices, and our own Cancel button. Plain fetch, no SDK. Prices are never typed here: each paid
// plan in shared/prices.json is a Stripe price with the lookup key gg_<plan>_monthly, made by scripts/stripe-sync.mjs.
//
// Secrets (Supabase → Edge Functions → Secrets, never in the repo):
//   STRIPE_SECRET_KEY      sk_test_… while testing, sk_live_… once the boss switches Stripe to live
//   STRIPE_WEBHOOK_SECRET  whsec_… of the endpoint …/functions/v1/stripe-webhook
//   BILLING_TEST_EMAILS    with a test key, only these members (comma-separated) get Checkout; everyone else keeps
//                          today's flow (the plan is saved, no payment). Ignored with a live key.
//   STRIPE_TAX             "on" to let Stripe Tax add sales tax (needs Stripe Tax set up first)
import { serviceClient } from "./common.ts";

const STRIPE_API = "https://api.stripe.com/v1/";
const STRIPE_VERSION = "2024-06-20";
export const PAID_PLANS = ["pro", "elite"] as const;
export type PaidPlan = (typeof PAID_PLANS)[number];
export const LIVE_STATUSES = ["active", "trialing", "past_due", "unpaid", "incomplete"];

export const lookupKey = (plan: PaidPlan) => `gg_${plan}_monthly`;
export const planFromLookupKey = (key: string | null | undefined): PaidPlan | null => {
  const plan = /^gg_([a-z]+)_monthly$/.exec(key ?? "")?.[1];
  return (PAID_PLANS as readonly string[]).includes(plan ?? "") ? (plan as PaidPlan) : null;
};

export class HttpError extends Error {
  constructor(readonly status: number, message: string) {
    super(message);
  }
}

const secretKey = () => Deno.env.get("STRIPE_SECRET_KEY") ?? "";

/** Whether this member gets Stripe Checkout: always with a live key; with a test key only for BILLING_TEST_EMAILS. */
export function billingEnabledFor(email: string | null | undefined) {
  const key = secretKey();
  if (key.startsWith("sk_live_")) return true;
  if (!key.startsWith("sk_test_") || !email) return false;
  const testers = (Deno.env.get("BILLING_TEST_EMAILS") ?? "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
  return testers.includes(email.toLowerCase());
}

/** Stripe's form encoding: nested objects as a[b]=c, arrays as a[0][b]=c. */
export function formEncode(params: Record<string, unknown>, prefix = "", out = new URLSearchParams()) {
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue;
    const name = prefix ? `${prefix}[${key}]` : key;
    if (Array.isArray(value)) {
      value.forEach((item, i) =>
        typeof item === "object" ? formEncode(item as Record<string, unknown>, `${name}[${i}]`, out) : out.append(`${name}[${i}]`, String(item))
      );
    } else if (typeof value === "object") formEncode(value as Record<string, unknown>, name, out);
    else out.append(name, String(value));
  }
  return out;
}

// deno-lint-ignore no-explicit-any
export type StripeObject = Record<string, any>;

export async function stripe(method: "GET" | "POST", path: string, params?: Record<string, unknown>, idempotencyKey?: string): Promise<StripeObject> {
  const url = new URL(path, STRIPE_API);
  if (method === "GET" && params) url.search = formEncode(params).toString();
  const headers: Record<string, string> = { Authorization: `Bearer ${secretKey()}`, "Stripe-Version": STRIPE_VERSION };
  if (method === "POST") headers["Content-Type"] = "application/x-www-form-urlencoded";
  if (idempotencyKey) headers["Idempotency-Key"] = idempotencyKey;
  let res: Response;
  try {
    res = await fetch(url, { method, headers, body: method === "POST" ? formEncode(params ?? {}) : undefined, signal: AbortSignal.timeout(10000) });
  } catch {
    throw new HttpError(502, "Billing is temporarily unavailable. Please try again.");
  }
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error("Stripe", method, path, res.status, body?.error?.type, body?.error?.code, body?.error?.message);
    throw new HttpError(502, "Billing is temporarily unavailable. Please try again.");
  }
  return body;
}

/**
 * Verifies a Stripe-Signature header (t=…,v1=…): HMAC-SHA256 of "t.payload" with the endpoint secret, compared in
 * constant time, at most five minutes old. Returns the parsed event, or null.
 */
export async function verifyWebhook(payload: string, header: string | null, secret: string, nowSeconds: number) {
  const parts = (header ?? "").split(",");
  const timestamp = Number(parts.find((p) => p.startsWith("t="))?.slice(2));
  const signatures = parts.filter((p) => p.startsWith("v1=")).map((p) => p.slice(3));
  if (!secret || !Number.isFinite(timestamp) || !signatures.length || Math.abs(nowSeconds - timestamp) > 300) return null;
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const mac = [...new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${timestamp}.${payload}`)))]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  const same = (a: string, b: string) => {
    if (a.length !== b.length) return false;
    let diff = 0;
    for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
    return diff === 0;
  };
  if (!signatures.some((s) => same(s, mac))) return null;
  try {
    return JSON.parse(payload) as StripeObject;
  } catch {
    return null;
  }
}

/** The member's Stripe customer id: created once (idempotent on the member id) and kept in billing_customers. */
export async function stripeCustomerFor(user: { id: string; email?: string; user_metadata?: Record<string, unknown> }) {
  const db = serviceClient();
  const { data: row } = await db.from("billing_customers").select("stripe_customer_id").eq("user_id", user.id).maybeSingle();
  if (row?.stripe_customer_id) return row.stripe_customer_id as string;
  const created = await stripe(
    "POST",
    "customers",
    { email: user.email, name: (user.user_metadata?.full_name as string | undefined) || undefined, metadata: { gg_user_id: user.id } },
    `gg-customer-${user.id}`,
  );
  await db.from("billing_customers").upsert({ user_id: user.id, stripe_customer_id: created.id }, { onConflict: "user_id", ignoreDuplicates: true });
  const { data: saved } = await db.from("billing_customers").select("stripe_customer_id").eq("user_id", user.id).single();
  return saved!.stripe_customer_id as string;
}

/** The member who owns a Stripe customer: our table first, then the customer's metadata. */
async function memberFor(customerId: string, metadataUserId?: string) {
  const { data } = await serviceClient().from("billing_customers").select("user_id").eq("stripe_customer_id", customerId).maybeSingle();
  return (data?.user_id as string | undefined) ?? metadataUserId ?? null;
}

/** Saves Stripe's current view of a subscription and keeps profiles.plan in step. Returns the member id, or null. */
export async function saveSubscription(sub: StripeObject) {
  const userId = await memberFor(sub.customer, sub.metadata?.gg_user_id);
  if (!userId) return null;
  const item = sub.items?.data?.[0];
  const metadataPlan = (PAID_PLANS as readonly string[]).includes(sub.metadata?.plan) ? (sub.metadata.plan as PaidPlan) : null;
  const plan = planFromLookupKey(item?.price?.lookup_key) ?? metadataPlan;
  if (!plan) {
    console.warn(`Subscription ${sub.id} has no GG plan price; not saved.`);
    return null;
  }
  const periodEnd = sub.current_period_end ?? item?.current_period_end;
  const db = serviceClient();
  await db.from("subscriptions").upsert(
    {
      id: sub.id,
      user_id: userId,
      plan,
      price_lookup_key: item?.price?.lookup_key ?? lookupKey(plan),
      status: sub.status,
      current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
      cancel_at_period_end: Boolean(sub.cancel_at_period_end),
      canceled_at: sub.canceled_at ? new Date(sub.canceled_at * 1000).toISOString() : null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" },
  );
  // The plan on the profile follows the live subscription; an ended one drops the member back to Free.
  const live = LIVE_STATUSES.includes(sub.status);
  await db.from("profiles").update({ plan: live ? plan : "free", plan_selected_at: new Date().toISOString() }).eq("id", userId);
  return userId;
}

/** Saves one invoice for the billing history (re-read with its charge, so the card or bank shows). */
export async function saveInvoice(invoiceId: string) {
  const inv = await stripe("GET", `invoices/${invoiceId}`, { expand: ["charge"] });
  if (inv.status === "draft") return;
  const userId = await memberFor(inv.customer, inv.subscription_details?.metadata?.gg_user_id);
  if (!userId) return;
  const pm = inv.charge?.payment_method_details;
  const paymentMethod = pm?.card
    ? `${String(pm.card.brand ?? "Card").replace(/^./, (c: string) => c.toUpperCase())} •••• ${pm.card.last4}`
    : pm?.us_bank_account
    ? `${pm.us_bank_account.bank_name ?? "Bank"} •••• ${pm.us_bank_account.last4}`
    : null;
  const plan = planFromLookupKey(inv.lines?.data?.[0]?.price?.lookup_key);
  await serviceClient().from("invoices").upsert(
    {
      id: inv.id,
      user_id: userId,
      subscription_id: inv.subscription ?? null,
      number: inv.number ?? null,
      description: plan ? `GG Trading ${plan === "pro" ? "Pro" : "Elite"} (monthly)` : (inv.lines?.data?.[0]?.description ?? "GG Trading"),
      status: inv.status,
      currency: inv.currency ?? "usd",
      subtotal: inv.subtotal ?? 0,
      tax: inv.tax ?? 0,
      total: inv.total ?? 0,
      amount_paid: inv.amount_paid ?? 0,
      payment_method: paymentMethod,
      hosted_invoice_url: inv.hosted_invoice_url ?? null,
      invoice_pdf: inv.invoice_pdf ?? null,
      created_at: new Date(inv.created * 1000).toISOString(),
      paid_at: inv.status_transitions?.paid_at ? new Date(inv.status_transitions.paid_at * 1000).toISOString() : null,
    },
    { onConflict: "id" },
  );
}
