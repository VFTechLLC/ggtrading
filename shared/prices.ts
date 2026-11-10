// Typed access to prices.json, the one place GG Trading prices are set.
import prices from "./prices.json";

export type PlanId = "free" | "pro" | "elite";

export interface PlanPrice {
  id: PlanId;
  name: string;
  /** In cents. */
  amount: number;
  interval: "month";
  /** The Stripe Price lookup key; null for the free plan, which isn't billed. */
  lookup_key: string | null;
  tax_code: string | null;
}

/** A single item sold through the store (one-time payment). None yet. */
export interface ItemPrice {
  id: string;
  name: string;
  amount: number;
  lookup_key: string;
  tax_code: string;
  /** Physical items get a shipping rate at checkout. */
  shippable: boolean;
}

export const CURRENCY = prices.currency;
export const PLAN_PRICES = prices.plans as PlanPrice[];
export const ITEM_PRICES = prices.items as ItemPrice[];

export const planPrice = (id: PlanId) => PLAN_PRICES.find((p) => p.id === id)!;

/** 4900 -> "$49", 4950 -> "$49.50". */
export function formatAmount(cents: number, currency = CURRENCY) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);
}
