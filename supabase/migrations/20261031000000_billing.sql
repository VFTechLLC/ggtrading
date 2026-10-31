-- GG Trading billing (Stripe). Run once in the Supabase SQL editor of the GG Trading project.
-- Stripe is the source of truth: these tables are a copy written only by the stripe-webhook function
-- (service role), so the account page loads fast and the plan can be checked without calling Stripe.

-- Terms of Service acceptance, recorded at signup. Members may set only these two columns themselves.
alter table public.profiles
  add column terms_version     text,
  add column terms_accepted_at timestamptz;

revoke update on public.profiles from anon, authenticated;
grant update (terms_version, terms_accepted_at) on public.profiles to authenticated;

create policy "Members record their own terms acceptance"
  on public.profiles for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- The Stripe customer behind each member.
create table public.billing_customers (
  user_id            uuid primary key references auth.users (id) on delete cascade,
  stripe_customer_id text not null unique,
  created_at         timestamptz not null default now()
);

alter table public.billing_customers enable row level security;
-- No policies: only the billing functions read or write it.

-- One row per Stripe subscription.
create table public.subscriptions (
  id                   text primary key,  -- Stripe subscription id (sub_...)
  user_id              uuid not null references auth.users (id) on delete cascade,
  plan                 text not null check (plan in ('pro', 'elite')),
  price_lookup_key     text not null,
  status               text not null,     -- Stripe status: active, past_due, canceled, incomplete, ...
  current_period_end   timestamptz,
  cancel_at_period_end boolean not null default false,
  canceled_at          timestamptz,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

alter table public.subscriptions enable row level security;

create policy "Members read their own subscriptions"
  on public.subscriptions for select to authenticated
  using ((select auth.uid()) = user_id);

create index subscriptions_user on public.subscriptions (user_id);

-- One row per Stripe invoice: subscription charges and single-item purchases. Amounts in cents.
create table public.invoices (
  id                 text primary key,    -- Stripe invoice id (in_...)
  user_id            uuid not null references auth.users (id) on delete cascade,
  subscription_id    text references public.subscriptions (id) on delete set null,
  number             text,
  description        text not null,
  status             text not null,       -- draft, open, paid, void, uncollectible
  currency           text not null default 'usd',
  subtotal           integer not null,
  tax                integer not null default 0,
  total              integer not null,
  amount_paid        integer not null default 0,
  payment_method     text,                -- e.g. "Visa •••• 4242"
  hosted_invoice_url text,
  invoice_pdf        text,
  created_at         timestamptz not null,
  paid_at            timestamptz
);

alter table public.invoices enable row level security;

create policy "Members read their own invoices"
  on public.invoices for select to authenticated
  using ((select auth.uid()) = user_id);

create index invoices_user_date on public.invoices (user_id, created_at desc);

-- Stripe event ids already applied, so a retried webhook is applied once.
create table public.stripe_events (
  id          text primary key,           -- evt_...
  type        text not null,
  received_at timestamptz not null default now()
);

alter table public.stripe_events enable row level security;
-- No policies: only the webhook writes it.
