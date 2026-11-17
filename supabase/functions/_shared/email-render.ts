// Email rendering (boss's email runbook, 2026-11-17). The emails live in docs/email-templates and are compiled into
// emails.generated.ts by scripts/build-emails.mjs (Edge Functions can't read the docs folder at run time).
// {{var}} is a value (HTML-escaped in the .html version); {{#var}}...{{/var}} is kept only when var isn't empty.
import { EMAILS, LAYOUTS } from "./emails.generated.ts";

export type EmailName = keyof typeof EMAILS;
export type Direction = "outbound" | "inbound";
export type Rendered = { subject: string; html: string; message: string };

export const escapeHtml = (value: unknown) =>
  String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

/** Pages the templates link to, as {{link_<name>}}: the site's own menu and footer. */
const LINKS: Record<string, string> = {
  home: "/", features: "/#features", performance: "/#performance", streams: "/streams", pricing: "/#pricing",
  contact: "/#contact", account: "/account", terms: "/terms",
};

/** Values every template can use. `origin` is the site, e.g. https://ggtrading.io. */
export function siteValues(origin = "https://ggtrading.io", sentAt = new Date()): Record<string, string> {
  const base = origin.replace(/\/$/, "");
  return {
    ...Object.fromEntries(Object.entries(LINKS).map(([name, path]) => [`link_${name}`, base + path])),
    logo_url: `${base}/email/gg-logo.png`,
    site_host: new URL(base).host,
    contact_email: "contact@ggtrading.io",
    discord_url: "https://discord.gg/npqsGfKNy",
    kick_url: "https://kick.com/GGTradingLLC",
    instagram_url: "https://www.instagram.com/ggstradingllc",
    sent_at: `${sentAt.toLocaleString("en-US", { timeZone: "America/New_York", month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })} ET`,
  };
}

const present = (value: unknown) => String(value ?? "").trim() !== "";

export function fill(template: string, values: Record<string, string>, escape: (v: string) => string): string {
  let out = template;
  for (let previous = ""; previous !== out;) {
    previous = out;
    out = out.replace(/\{\{#(\w+)\}\}((?:(?!\{\{#\1\}\})[\s\S])*?)\{\{\/\1\}\}/g, (_m, key: string, inner: string) => (present(values[key]) ? inner : ""));
  }
  return out.replace(/\{\{(\w+)\}\}/g, (match, key: string) => (key in values ? escape(String(values[key] ?? "")) : match));
}

/** One email in one direction: subject, HTML and plain text (`message`, the field sendEmails already sends). */
export function renderEmail(name: EmailName, direction: Direction, vars: Record<string, string>, origin?: string, sentAt?: Date): Rendered {
  const email = EMAILS[name][direction];
  const layout = LAYOUTS[direction];
  const values = { ...siteValues(origin, sentAt), ...vars };
  const plain = (v: string) => v;
  const subject = fill(email.subject, values, plain).replace(/\s+/g, " ").trim().slice(0, 140);
  const frame = (escape: (v: string) => string) => ({
    preheader: fill(email.preheader, values, escape),
    header_label: fill(email.header_label, values, escape),
    footer_note: fill(email.footer_note, values, escape),
  });
  const htmlPieces = { ...frame(escapeHtml), subject: escapeHtml(subject), content: fill(email.html, values, escapeHtml) };
  const html = fill(layout.html, { ...Object.fromEntries(Object.entries(values).map(([k, v]) => [k, escapeHtml(v)])), ...htmlPieces }, plain);
  const message = fill(layout.text, { ...values, ...frame(plain), subject, content: fill(email.text, values, plain) }, plain)
    .replace(/\n{3,}/g, "\n\n").trim();
  return { subject, html, message };
}
