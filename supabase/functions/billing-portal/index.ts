// POST {returnUrl} from a signed-in member → {url} of Stripe's Customer Portal (update card, see invoices, resume).
import { json, preflight, requestUser, serviceClient, siteOrigin } from "../_shared/common.ts";
import { HttpError, stripe } from "../_shared/stripe.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return preflight(req);
  if (req.method !== "POST") return json(req, 405, { error: "Use POST" });
  try {
    const user = await requestUser(req);
    if (!user) return json(req, 401, { error: "Please sign in first." });

    const { data: row } = await serviceClient().from("billing_customers").select("stripe_customer_id").eq("user_id", user.id).maybeSingle();
    if (!row?.stripe_customer_id) return json(req, 404, { error: "There's no billing account yet. Choose Pro or Elite first." });

    // Only send people back to our own site.
    const origin = siteOrigin(req);
    let returnUrl = `${origin}/account`;
    try {
      const asked = new URL(String((await req.json()).returnUrl ?? ""));
      if (asked.origin === origin) returnUrl = asked.toString();
    } catch {
      // keep the default
    }

    const session = await stripe("POST", "billing_portal/sessions", { customer: row.stripe_customer_id, return_url: returnUrl });
    return json(req, 200, { url: session.url });
  } catch (err) {
    if (err instanceof HttpError) return json(req, err.status, { error: err.message });
    console.error("billing-portal failed:", err);
    return json(req, 500, { error: "Something went wrong. Please try again." });
  }
});
