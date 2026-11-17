# Forms and their email variables (GG Trading)

Step 3 of the email runbook. Every form on ggtrading.io, the variables its handler (Supabase Edge Function) receives
or adds, and which email shows them.

| Form | Where | Handler | Email pair | Customer email | Team email (ADMIN_EMAIL) |
|---|---|---|---|---|---|
| Contact | Home `#contact` | `supabase/functions/contact` | `emails/contact/` | "We got your message" | "New GG Trading contact message from …" |
| Plan signup (no payment) | Home `#pricing`, signed in | `supabase/functions/membership` | `emails/membership/` | "Welcome to GG Trading <plan>" | "New GG Trading <plan> signup" |
| Paid subscription | Stripe Checkout, then webhook | `supabase/functions/stripe-webhook` | `emails/subscription/` | "Welcome to GG Trading <plan>" | "New paid GG Trading <plan> subscription" |
| Join (email sign-up) | Join dialog | Supabase Auth | `auth/confirm-signup.html` | "Confirm your GG Trading account" | none |
| Forgot password | Log in dialog | Supabase Auth | `auth/reset-password.html` | "Reset your GG Trading password" | none |

## Contact (`emails/contact/`)

| Variable | Label shown to people | Type | Required | Example | Customer email | Team email |
|---|---|---|---|---|---|---|
| `name` | Name | text | yes | Jordan Sample | yes | yes |
| `email` | Email (pre-filled when signed in) | email | yes | jordan@example.com | yes | yes |
| `message` | Message | textarea | yes | Do you cover NQ on Sundays? | **no** (never echoed to a typed address) | yes |
| `member` / `member_line` | (server: signed in?) | flag | auto | Yes, signed in | no | yes |
| `sent_at` | (server) | datetime | auto | Nov 17, 2026, 10:04 AM ET | no | yes |

Dropped on purpose: the Turnstile token. Kept out of emails: the hashed IP.

## Plan signup (`emails/membership/`)

| Variable | Label | Type | Required | Example | Customer email | Team email |
|---|---|---|---|---|---|---|
| `plan` | Plan chosen (Free, Pro, Elite) | select | yes | Pro | yes | yes |
| `name` | (profile or Google name) | text | no | Jordan Sample | yes ("Hi" alone if empty) | yes (hidden if empty) |
| `display_name` | (name, or "A new member") | text | auto | Jordan Sample | no | yes |
| `email` | (signed-in account) | email | auto | jordan@example.com | no | yes |
| `previous_plan` | (profile) | text | no | Free | no | yes (hidden if empty) |

## Paid subscription (`emails/subscription/`)

| Variable | Label | Type | Required | Example | Customer email | Team email |
|---|---|---|---|---|---|---|
| `plan` | (Stripe price → plan name) | text | auto | Elite | yes | yes |
| `name` / `display_name` | (profile) | text | no | Jordan Sample | yes | yes |
| `email` | (profile) | email | auto | jordan@example.com | no | yes |

## Values every template can use

From `siteValues()` in `supabase/functions/_shared/email-render.ts`: `link_home`, `link_features`, `link_performance`,
`link_streams`, `link_pricing`, `link_contact`, `link_account`, `link_terms`, `logo_url`, `site_host`,
`contact_email` (contact@ggtrading.io), `discord_url`, `kick_url`, `instagram_url`, `sent_at`.
