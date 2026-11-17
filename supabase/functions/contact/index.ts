// Contact form: saves the message, then emails the sender a confirmation and VFTech the message.
import { ADMIN_EMAIL, json, preflight, requestUser, sendEmails, serviceClient, siteOrigin } from "../_shared/common.ts";
import { renderEmail } from "../_shared/email-render.ts";

const MAX_PER_HOUR = 5;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function sha256(text: string) {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Cloudflare Turnstile check. Skipped until TURNSTILE_SECRET_KEY is set (the site only shows the widget once its site key is set). */
async function passesCaptcha(token: string, ip: string): Promise<boolean> {
  const secret = Deno.env.get("TURNSTILE_SECRET_KEY");
  if (!secret) return true;
  if (!token) return false;
  const form = new FormData();
  form.append("secret", secret);
  form.append("response", token);
  if (ip) form.append("remoteip", ip);
  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body: form });
  const result = await res.json().catch(() => ({ success: false }));
  return result.success === true;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return preflight(req);
  if (req.method !== "POST") return json(req, 405, { error: "Use POST" });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json(req, 400, { error: "Invalid request" });
  }
  const name = String(body.name ?? "").trim();
  const email = String(body.email ?? "").trim();
  const message = String(body.message ?? "").trim();

  // Hidden field real visitors never fill in. Bots get a normal-looking answer and nothing is sent.
  if (String(body.website ?? "")) return json(req, 200, { ok: true });

  if (!name || name.length > 100) return json(req, 400, { error: "Please enter your name." });
  if (!EMAIL.test(email) || email.length > 254) return json(req, 400, { error: "Please enter a valid email address." });
  if (!message || message.length > 5000) return json(req, 400, { error: "Please enter a message (up to 5,000 characters)." });

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "";
  if (!(await passesCaptcha(String(body.captchaToken ?? ""), ip))) {
    return json(req, 400, { error: "The spam check didn't pass. Please try again." });
  }

  const db = serviceClient();
  const ipHash = await sha256(ip || "unknown");
  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count } = await db.from("contact_messages").select("id", { count: "exact", head: true }).eq("ip_hash", ipHash).gte("created_at", since);
  if ((count ?? 0) >= MAX_PER_HOUR) return json(req, 429, { error: "Too many messages. Please try again in an hour." });

  const user = await requestUser(req);
  const { data: saved, error } = await db
    .from("contact_messages")
    .insert({ user_id: user?.id ?? null, name, email, message, ip_hash: ipHash })
    .select("id")
    .single();
  if (error) {
    console.error("Saving contact message failed:", error.message);
    return json(req, 500, { error: "Something went wrong. Please try again." });
  }

  // docs/email-templates/emails/contact. The visitor's copy doesn't repeat their message: the form must not be a way
  // to send arbitrary text to any address.
  const origin = siteOrigin(req);
  const vars = { name, email, message, member: user ? "yes" : "", member_line: user ? "Yes, signed in" : "No" };
  const emailed = await sendEmails([
    { template: "user", email: { to: email, toName: name, ...renderEmail("contact", "outbound", vars, origin) } },
    { template: "admin", email: { to: ADMIN_EMAIL, replyTo: email, ...renderEmail("contact", "inbound", vars, origin) } },
  ]);
  if (emailed) await db.from("contact_messages").update({ emailed: true }).eq("id", saved.id);

  return json(req, 200, { ok: true });
});
