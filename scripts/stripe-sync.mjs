#!/usr/bin/env node
// Makes the GG Trading Stripe account match shared/prices.json (the one price file): one product per paid plan and one
// active monthly price with the plan's lookup key (gg_pro_monthly, gg_elite_monthly), which is what Checkout charges.
// A changed amount gets a new price that takes over the lookup key; existing subscribers keep theirs. Also sets the
// Customer Portal: invoices, card/bank updates, and cancel at period end (no refunds).
//
//   node scripts/stripe-sync.mjs --key-file <path>            show what would change (no writes)
//   node scripts/stripe-sync.mjs --key-file <path> --apply    make the changes
// The key comes from --key-file (a file holding only the key) or STRIPE_SECRET_KEY. It is never printed.
// Only sk_test_ keys, unless --live is given too (after the boss switches Stripe to live).
import { readFileSync } from "node:fs";

const args = process.argv.slice(2);
const apply = args.includes("--apply");
const live = args.includes("--live");
const keyFile = args[args.indexOf("--key-file") + 1];
const key = (args.includes("--key-file") && keyFile ? readFileSync(keyFile, "utf8") : process.env.STRIPE_SECRET_KEY ?? "").replace(/^﻿/, "").trim();
if (!key) throw new Error("No key: pass --key-file <path> or set STRIPE_SECRET_KEY.");
if (!key.startsWith("sk_test_") && !(live && key.startsWith("sk_live_"))) throw new Error("Refusing a non-test key. Add --live only once Stripe is live.");

const prices = JSON.parse(readFileSync(new URL("../shared/prices.json", import.meta.url), "utf8"));
const site = "https://ggtrading.io";

function formEncode(params, prefix = "", out = new URLSearchParams()) {
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null) continue;
    const name = prefix ? `${prefix}[${k}]` : k;
    if (Array.isArray(v)) v.forEach((item, i) => (typeof item === "object" ? formEncode(item, `${name}[${i}]`, out) : out.append(`${name}[${i}]`, String(item))));
    else if (typeof v === "object") formEncode(v, name, out);
    else out.append(name, String(v));
  }
  return out;
}

async function stripe(method, path, params) {
  const url = new URL(path, "https://api.stripe.com/v1/");
  if (method === "GET" && params) url.search = formEncode(params).toString();
  const res = await fetch(url, {
    method,
    headers: { Authorization: `Bearer ${key}`, "Stripe-Version": "2024-06-20", ...(method === "POST" ? { "Content-Type": "application/x-www-form-urlencoded" } : {}) },
    body: method === "POST" ? formEncode(params ?? {}) : undefined,
  });
  const body = await res.json();
  if (!res.ok) throw new Error(`Stripe ${method} ${path}: ${body.error?.message ?? res.status}`);
  return body;
}
const say = (text) => console.log(`${apply ? "" : "[dry run] "}${text}`);

const account = await stripe("GET", "account");
console.log(`Stripe ${key.startsWith("sk_test_") ? "TEST" : "LIVE"} mode, account ${account.settings?.dashboard?.display_name ?? account.id}`);
const paid = prices.plans.filter((p) => p.lookup_key && p.amount > 0);
const products = (await stripe("GET", "products", { limit: 100, active: "true" })).data;

for (const plan of paid) {
  const name = `GG Trading ${plan.name}`;
  let product = products.find((p) => p.metadata?.gg_plan_id === plan.id);
  if (!product) {
    say(`create product ${name}`);
    if (apply) product = await stripe("POST", "products", { name, metadata: { gg_plan_id: plan.id }, ...(plan.tax_code ? { tax_code: plan.tax_code } : {}) });
  } else if (product.name !== name) {
    say(`rename product ${product.name} → ${name}`);
    if (apply) await stripe("POST", `products/${product.id}`, { name });
  }
  const current = (await stripe("GET", "prices", { lookup_keys: [plan.lookup_key], active: "true", limit: 1 })).data[0];
  if (current && current.unit_amount === plan.amount && current.currency === prices.currency && current.recurring?.interval === plan.interval) {
    console.log(`ok      ${name}: $${plan.amount / 100}/${plan.interval} (${plan.lookup_key})`);
    continue;
  }
  say(`${current ? "replace" : "create "} ${name}: $${plan.amount / 100}/${plan.interval}${current ? ` (was $${current.unit_amount / 100})` : ""}`);
  if (apply) {
    await stripe("POST", "prices", {
      product: product.id,
      currency: prices.currency,
      unit_amount: plan.amount,
      recurring: { interval: plan.interval },
      lookup_key: plan.lookup_key,
      transfer_lookup_key: "true",
      tax_behavior: "exclusive",
      nickname: `${plan.name} monthly`,
    });
    if (current) await stripe("POST", `prices/${current.id}`, { active: "false" });
  }
}

const portal = (await stripe("GET", "billing_portal/configurations", { is_default: "true", limit: 1 })).data[0];
const portalSettings = {
  business_profile: { headline: "GG Trading billing", terms_of_service_url: `${site}/terms`, privacy_policy_url: `${site}/terms` },
  features: {
    invoice_history: { enabled: "true" },
    payment_method_update: { enabled: "true" },
    customer_update: { enabled: "true", allowed_updates: ["email", "address", "name"] },
    subscription_cancel: { enabled: "true", mode: "at_period_end", proration_behavior: "none" },
    subscription_update: { enabled: "false" },
  },
  default_return_url: `${site}/account`,
};
say(`${portal ? "update" : "create"} the Customer Portal settings`);
if (apply) await stripe("POST", portal ? `billing_portal/configurations/${portal.id}` : "billing_portal/configurations", portalSettings);
console.log(apply ? "Done." : "Nothing changed. Run again with --apply.");
