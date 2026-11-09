// Shared by the contact and membership functions: CORS, the service-role client, and Resend email.
import { createClient } from "npm:@supabase/supabase-js@2";

const ALLOWED_ORIGINS = (Deno.env.get("ALLOWED_ORIGINS") ?? "https://ggtrading.io,https://www.ggtrading.io,http://localhost:3000")
  .split(",")
  .map((s) => s.trim());

export const SITE_NAME = Deno.env.get("SITE_NAME") ?? "GG Trading";
// Where contact messages and signup notices go. admin@vftech.io for now; set ADMIN_EMAIL to change it.
export const ADMIN_EMAIL = Deno.env.get("ADMIN_EMAIL") ?? "admin@vftech.io";

function corsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("Origin") ?? "";
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]!,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    Vary: "Origin",
  };
}

/** The site origin for links back from Stripe: the calling page's origin when it is one of ours, else ggtrading.io. */
export const siteOrigin = (req: Request) => {
  const origin = req.headers.get("Origin") ?? "";
  return ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]!;
};

export const preflight = (req: Request) => new Response(null, { status: 204, headers: corsHeaders(req) });

export const json = (req: Request, status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders(req), "Content-Type": "application/json" } });

export const serviceClient = () =>
  createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

/** The signed-in user behind the request's bearer token, or null for visitors. */
export async function requestUser(req: Request) {
  const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!token || token.startsWith("sb_")) return null; // the publishable key, not a user session
  const { data } = await serviceClient().auth.getUser(token);
  return data.user ?? null;
}

export interface Email {
  to: string;
  toName?: string;
  subject: string;
  message: string;
  replyTo?: string;
}

/**
 * Sends emails through Resend (https://resend.com) in one batch call.
 * RESEND_API_KEY is a server-side secret: set it with `supabase secrets set`, never in the repo or the site.
 * RESEND_FROM must be an address on a domain verified in Resend, e.g. "GG Trading <noreply@ggtrading.io>".
 * `template` is kept so callers don't change; both kinds go out as plain-text emails.
 * Returns false if Resend isn't set up yet or the send failed; the data is saved either way.
 */
export async function sendEmails(emails: { template: "user" | "admin"; email: Email }[]): Promise<boolean> {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  const from = Deno.env.get("RESEND_FROM") ?? `${SITE_NAME} <noreply@ggtrading.io>`;
  if (!apiKey) {
    console.warn("RESEND_API_KEY isn't set yet; not sending emails.");
    return false;
  }
  if (emails.length === 0) return true;

  const res = await fetch("https://api.resend.com/emails/batch", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(
      emails.map(({ email }) => ({
        from,
        to: [email.toName ? `${email.toName.replace(/[<>"]/g, "")} <${email.to}>` : email.to],
        subject: email.subject,
        text: email.message,
        reply_to: email.replyTo ?? ADMIN_EMAIL,
      })),
    ),
  });
  if (!res.ok) {
    console.error(`Resend send failed: ${res.status} ${await res.text()}`);
    return false;
  }
  return true;
}
