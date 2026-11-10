// POST {subscription: "sub_…"} from its owner → cancels at the end of the paid period (no refunds, boss 2026-10-31).
import { json, preflight, requestUser, serviceClient } from "../_shared/common.ts";
import { HttpError, saveSubscription, stripe } from "../_shared/stripe.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return preflight(req);
  if (req.method !== "POST") return json(req, 405, { error: "Use POST" });
  try {
    const user = await requestUser(req);
    if (!user) return json(req, 401, { error: "Please sign in first." });

    let id = "";
    try {
      id = String((await req.json()).subscription ?? "");
    } catch {
      // handled below
    }
    if (!/^sub_[A-Za-z0-9]+$/.test(id)) return json(req, 400, { error: "Unknown subscription." });

    const { data: row } = await serviceClient().from("subscriptions").select("user_id").eq("id", id).maybeSingle();
    if (row?.user_id !== user.id) return json(req, 404, { error: "Unknown subscription." });

    const sub = await stripe("POST", `subscriptions/${id}`, { cancel_at_period_end: "true" }, `gg-cancel-${id}`);
    await saveSubscription(sub);
    return json(req, 200, { ok: true });
  } catch (err) {
    if (err instanceof HttpError) return json(req, err.status, { error: err.message });
    console.error("billing-cancel failed:", err);
    return json(req, 500, { error: "Something went wrong. Please try again." });
  }
});
