// Membership signup: a signed-in member picks a plan. Saves it, then emails the member and VFTech.
// There are no payments yet; this records who wants which plan.
import { ADMIN_EMAIL, json, preflight, requestUser, sendEmails, serviceClient, siteOrigin } from "../_shared/common.ts";
import { renderEmail } from "../_shared/email-render.ts";

const PLANS: Record<string, string> = { free: "Free", pro: "Pro", elite: "Elite" };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return preflight(req);
  if (req.method !== "POST") return json(req, 405, { error: "Use POST" });

  const user = await requestUser(req);
  if (!user) return json(req, 401, { error: "Please sign in first." });

  let plan = "";
  try {
    plan = String((await req.json()).plan ?? "");
  } catch {
    // handled below
  }
  if (!PLANS[plan]) return json(req, 400, { error: "Unknown plan." });

  const db = serviceClient();
  const { data: profile } = await db.from("profiles").select("plan, full_name").eq("id", user.id).maybeSingle();
  if (profile?.plan === plan) return json(req, 200, { ok: true, plan, alreadyMember: true });

  const { error } = await db
    .from("profiles")
    .upsert({ id: user.id, email: user.email, plan, plan_selected_at: new Date().toISOString() }, { onConflict: "id" });
  if (error) {
    console.error("Saving plan failed:", error.message);
    return json(req, 500, { error: "Something went wrong. Please try again." });
  }

  const name = profile?.full_name ?? (user.user_metadata?.full_name as string | undefined) ?? "";
  // docs/email-templates/emails/membership
  const origin = siteOrigin(req);
  const vars = {
    name, display_name: name || "A new member", email: user.email!, plan: PLANS[plan],
    previous_plan: profile?.plan ? PLANS[profile.plan] ?? profile.plan : "",
  };
  await sendEmails([
    { template: "user", email: { to: user.email!, toName: name, ...renderEmail("membership", "outbound", vars, origin) } },
    { template: "admin", email: { to: ADMIN_EMAIL, replyTo: user.email, ...renderEmail("membership", "inbound", vars, origin) } },
  ]);

  return json(req, 200, { ok: true, plan });
});
