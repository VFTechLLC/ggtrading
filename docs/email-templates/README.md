# Email templates (GG Trading)

Every email ggtrading.io sends is built from this folder (VF Tech email runbook, 2026-11-17). It's the only copy:
`node scripts/build-emails.mjs` compiles it into `supabase/functions/_shared/emails.generated.ts`, because Edge
Functions can't read the docs folder at run time, and `pnpm check:emails` fails if that file is stale.

```
docs/email-templates/
  README.md, forms.md     this file; every form, its variables, and which email shows them
  base/outbound.html/.txt to members and visitors: navy header with the logo, Features/Performance/Streams/Pricing/
                          Your account menu; footer with contact, Discord/Kick/Instagram, the risk disclaimer, Terms
  base/inbound.html/.txt  to the team: small header with the site and what this is; when it was sent
  emails/<form>/          email.json (subjects, preheaders, footer notes, sample) + outbound/inbound .html and .txt
  auth/                   Supabase Auth emails (confirm sign-up, reset password): *.body.html is the source,
                          *.html is generated and ready to paste into Supabase
  previews/               every email rendered with its sample (.html, .txt) + screenshots (light, dark, phone)
```

## How sending works

- `sendEmails()` in `supabase/functions/_shared/common.ts` sends through Resend from `RESEND_FROM` (unchanged), now
  with `html` alongside the plain text. Callers get both from `renderEmail(name, direction, vars)`.
- `{{var}}` is a value (HTML-escaped in the HTML); `{{#var}}…{{/var}}` shows only when var isn't empty.
- Customer copies never repeat free text the visitor typed (the contact message), so the form can't be used to send
  someone arbitrary content.
- The logo is `client/public/email/gg-logo.png` (240 px, 35 KB), served from the site.

## Deploying a change

1. Edit the files here, run `node scripts/build-emails.mjs --previews`, look at the previews.
2. Merge. The site deploy publishes the logo.
3. `supabase functions deploy contact membership stripe-webhook` (Edge Functions don't deploy from CI).
4. Auth emails: paste `auth/confirm-signup.html` and `auth/reset-password.html` into Supabase → GG Trading →
   Authentication → Emails, with the subjects in `auth/auth.json`.

## Test checklist (runbook step 6)

Mail goes to ADMIN_EMAIL (admin@vftech.io, contact@ggtrading.io) and the test address typed in. Use VF Tech
addresses only.

- [ ] Contact form, every field: both emails arrive, Reply on the team email goes to the sender
- [ ] `<b>test</b> & "quotes"` in the message shows as text in the team email
- [ ] Plan signup from a test account: welcome and team notice
- [ ] Sign-up confirmation and password reset (after pasting the auth templates)
- [ ] Gmail web + app, Outlook, Apple Mail, light and dark; every link opens on ggtrading.io
