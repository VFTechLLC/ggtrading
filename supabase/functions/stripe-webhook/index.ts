// Stripe → us: subscription and invoice changes, signature-checked with STRIPE_WEBHOOK_SECRET.
// Events can arrive late, twice or out of order, so each one re-reads the object from Stripe and saves it as it is now.
// Endpoint: https://gbiribpgeolhwfsduluy.supabase.co/functions/v1/stripe-webhook (verify_jwt off: Stripe has no JWT).
import { ADMIN_EMAIL, json, preflight, sendEmails, serviceClient, SITE_NAME } from "../_shared/common.ts";
import { HttpError, saveInvoice, saveSubscription, stripe, verifyWebhook } from "../_shared/stripe.ts";

const PLAN_NAMES: Record<string, string> = { pro: "Pro", elite: "Elite" };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return preflight(req);
  if (req.method !== "POST") return json(req, 405, { error: "Use POST" });
  const secret = Deno.env.get("STRIPE_WEBHOOK_SECRET") ?? "";
  if (!secret || !Deno.env.get("STRIPE_SECRET_KEY")) return json(req, 404, { error: "Not found" });
  if (Number(req.headers.get("Content-Length") ?? 0) > 262144) return json(req, 413, { error: "Too large" });

  const payload = await req.text();
  const event = await verifyWebhook(payload, req.headers.get("Stripe-Signature"), secret, Math.floor(Date.now() / 1000));
  if (!event?.id || !event.type) return json(req, 400, { error: "Invalid signature" });

  try {
    const obj = event.data?.object ?? {};
    if (event.type === "checkout.session.completed" && typeof obj.subscription === "string") {
      const userId = await saveSubscription(await stripe("GET", `subscriptions/${obj.subscription}`));
      if (userId) await welcome(userId, obj.metadata?.plan);
    } else if (event.type.startsWith("customer.subscription.") && typeof obj.id === "string") {
      await saveSubscription(await stripe("GET", `subscriptions/${obj.id}`));
    } else if (event.type.startsWith("invoice.") && typeof obj.id === "string") {
      await saveInvoice(obj.id);
    }
    await serviceClient().from("stripe_events").upsert({ id: event.id, type: event.type }, { onConflict: "id", ignoreDuplicates: true });
    return json(req, 200, { received: true });
  } catch (err) {
    // A 5xx makes Stripe retry later.
    console.error(`stripe-webhook ${event.type} ${event.id} failed:`, err instanceof HttpError ? err.message : err);
    return json(req, 500, { error: "Try again" });
  }
});

/** Welcome email to the new paying member, and a notice to VF Tech. Best-effort. */
async function welcome(userId: string, plan: string | undefined) {
  const { data: profile } = await serviceClient().from("profiles").select("email, full_name").eq("id", userId).maybeSingle();
  if (!profile?.email) return;
  const name = (profile.full_name as string | null) ?? "";
  const planName = PLAN_NAMES[plan ?? ""] ?? "paid";
  await sendEmails([
    {
      template: "user",
      email: {
        to: profile.email,
        toName: name,
        subject: `Welcome to ${SITE_NAME} ${planName}`,
        message:
          `Hi${name ? ` ${name}` : ""},\n\nThanks for subscribing to ${SITE_NAME} ${planName}! Your payment went through and your plan is active.\n\n` +
          `You can see your plan, invoices and the cancel option any time on your account page: https://ggtrading.io/account`,
      },
    },
    {
      template: "admin",
      email: { to: ADMIN_EMAIL, subject: `New paid ${SITE_NAME} ${planName} subscription`, message: `${name || "A member"} <${profile.email}> subscribed to ${planName}.`, replyTo: profile.email },
    },
  ]);
}
