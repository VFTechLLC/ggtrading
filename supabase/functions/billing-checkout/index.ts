// POST {plan: "pro" | "elite"} from a signed-in member → {url} of a Stripe Checkout page for that monthly plan.
// Returns {enabled: false} when online payment isn't on for this member yet (no key, or a test key and the member
// isn't in BILLING_TEST_EMAILS); the site then keeps today's flow and just saves the plan.
import { json, preflight, requestUser, serviceClient, siteOrigin } from "../_shared/common.ts";
import { billingEnabledFor, HttpError, LIVE_STATUSES, lookupKey, PAID_PLANS, type PaidPlan, stripe, stripeCustomerFor } from "../_shared/stripe.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return preflight(req);
  if (req.method !== "POST") return json(req, 405, { error: "Use POST" });
  try {
    const user = await requestUser(req);
    if (!user) return json(req, 401, { error: "Please sign in first." });

    let plan = "";
    try {
      plan = String((await req.json()).plan ?? "");
    } catch {
      // handled below
    }
    if (!(PAID_PLANS as readonly string[]).includes(plan)) return json(req, 400, { error: "Choose Pro or Elite." });
    if (!billingEnabledFor(user.email)) return json(req, 200, { enabled: false });

    const db = serviceClient();
    const { data: profile } = await db.from("profiles").select("terms_version").eq("id", user.id).maybeSingle();
    if (!profile?.terms_version) return json(req, 400, { error: "Please accept the Terms of Service first (log out and back in to see the box)." });

    const { data: current } = await db
      .from("subscriptions")
      .select("id")
      .eq("user_id", user.id)
      .in("status", LIVE_STATUSES)
      .limit(1)
      .maybeSingle();
    if (current) return json(req, 409, { error: "You already have a plan. Open your account to change or cancel it." });

    const prices = await stripe("GET", "prices", { lookup_keys: [lookupKey(plan as PaidPlan)], active: "true", limit: 1 });
    const price = prices.data?.[0];
    if (!price) throw new HttpError(503, "This plan isn't available for online payment yet. Please contact us.");

    const customer = await stripeCustomerFor(user);
    const origin = siteOrigin(req);
    const metadata = { gg_user_id: user.id, plan, terms_version: profile.terms_version };
    const session = await stripe("POST", "checkout/sessions", {
      mode: "subscription",
      customer,
      client_reference_id: user.id,
      line_items: [{ price: price.id, quantity: 1 }],
      // Cards and US bank (ACH) only, as for VF Tech (boss, 2026-11-08).
      payment_method_types: ["card", "us_bank_account"],
      success_url: `${origin}/account?billing=success`,
      cancel_url: `${origin}/#pricing`,
      billing_address_collection: "required",
      customer_update: { address: "auto", name: "auto" },
      automatic_tax: { enabled: Deno.env.get("STRIPE_TAX") === "on" ? "true" : "false" },
      subscription_data: { metadata },
      metadata,
      allow_promotion_codes: "false",
    });
    return json(req, 200, { enabled: true, url: session.url });
  } catch (err) {
    if (err instanceof HttpError) return json(req, err.status, { error: err.message });
    console.error("billing-checkout failed:", err);
    return json(req, 500, { error: "Something went wrong. Please try again." });
  }
});
