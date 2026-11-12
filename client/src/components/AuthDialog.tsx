/* Sign-in / sign-up dialog. Google first (one click), email and password as the alternative.
   Creating an account (Google or email sign-up) needs the Terms of Service box ticked. */

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { rememberTermsAccepted } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Turnstile, { TURNSTILE_SITE_KEY } from "@/components/Turnstile";
import { PLAN_NAMES, supabase, type Plan } from "@/lib/supabase";
import { TERMS_VERSION } from "@/lib/terms";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
    <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.3-1.6 3.9-5.5 3.9-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.3 14.6 2.3 12 2.3 6.7 2.3 2.4 6.6 2.4 12s4.3 9.7 9.6 9.7c5.5 0 9.2-3.9 9.2-9.4 0-.6-.1-1.1-.2-1.6H12z" />
  </svg>
);

const returnUrl = () => window.location.origin + window.location.pathname;

export default function AuthDialog({ open, onOpenChange, plan }: { open: boolean; onOpenChange: (open: boolean) => void; plan: Plan | null }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [checkEmail, setCheckEmail] = useState(false);
  const [agreed, setAgreed] = useState(false);
  // Supabase checks this token itself once CAPTCHA protection is turned on in the project's Auth settings.
  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaReset, setCaptchaReset] = useState(0);
  const [tab, setTab] = useState<"signup" | "login">(plan ? "signup" : "login");
  useEffect(() => {
    if (open) setTab(plan ? "signup" : "login");
  }, [open, plan]);

  const needTerms = () => {
    if (agreed) return false;
    toast.error("Please agree to the Terms of Service first.");
    return true;
  };

  async function google() {
    if (needTerms()) return;
    rememberTermsAccepted();
    setBusy(true);
    const { error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: returnUrl() } });
    if (error) {
      setBusy(false);
      toast.error(error.message);
    }
  }

  async function withEmail(e: FormEvent, mode: "signup" | "login") {
    e.preventDefault();
    if (mode === "signup" && needTerms()) return;
    if (TURNSTILE_SITE_KEY && !captchaToken) return toast.error("Please wait for the spam check to finish.");
    if (mode === "signup") rememberTermsAccepted();
    setBusy(true);
    const captcha = captchaToken || undefined;
    const { data, error } =
      mode === "signup"
        ? await supabase.auth.signUp({
            email,
            password,
            // The chosen plan rides along with the account, so it survives a closed tab or confirming on another device.
            options: { emailRedirectTo: returnUrl(), captchaToken: captcha, data: { terms_version: TERMS_VERSION, ...(plan ? { pending_plan: plan } : {}) } },
          })
        : await supabase.auth.signInWithPassword({ email, password, options: { captchaToken: captcha } });
    setBusy(false);
    setCaptchaReset((n) => n + 1);
    if (error) return toast.error(error.message);
    // An email that already has an account: Supabase answers "ok" but sends nothing (so outsiders can't probe emails).
    // It shows up as a user with no identities; tell the person to log in instead of waiting for an email.
    if (mode === "signup" && data.user && (data.user.identities?.length ?? 1) === 0) {
      setTab("login");
      return toast.info("This email already has an account. Log in instead, or use Continue with Google if you signed up that way.");
    }
    // With email confirmation on, sign-up returns no session until the link in the email is clicked.
    if (mode === "signup" && !data.session) setCheckEmail(true);
  }

  async function forgotPassword() {
    if (!email) return toast.error("Enter your email above first.");
    if (TURNSTILE_SITE_KEY && !captchaToken) return toast.error("Please wait for the spam check to finish.");
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: returnUrl(), captchaToken: captchaToken || undefined });
    setBusy(false);
    setCaptchaReset((n) => n + 1);
    if (error) return toast.error(error.message);
    toast.success("If that email has an account, a link to set a new password is on its way.");
  }

  const emailForm = (mode: "signup" | "login") => (
    <form className="flex flex-col gap-3" onSubmit={(e) => withEmail(e, mode)}>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${mode}-email`}>Email</Label>
        <Input id={`${mode}-email`} type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${mode}-password`}>Password</Label>
        <Input
          id={`${mode}-password`}
          type="password"
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
          minLength={8}
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      {mode === "login" && (
        <button type="button" onClick={() => void forgotPassword()} disabled={busy} className="self-start text-xs text-[oklch(0.75_0.15_292)] hover:text-white underline">
          Forgot password?
        </button>
      )}
      <Turnstile onToken={setCaptchaToken} resetKey={captchaReset} />
      <Button type="submit" disabled={busy} className="bg-[oklch(0.48_0.26_292)] hover:bg-[oklch(0.55_0.26_292)] text-white font-semibold">
        {mode === "signup" ? "Create account" : "Log in"}
      </Button>
    </form>
  );

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) setCheckEmail(false); }}>
      <DialogContent className="bg-[oklch(0.10_0.04_265)] border-white/10 text-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            {plan ? `Join GG Trading ${PLAN_NAMES[plan]}` : "Welcome to GG Trading"}
          </DialogTitle>
          <DialogDescription className="text-white/60">
            {plan ? "Create an account or log in to finish signing up." : "Log in or create your free account."}
          </DialogDescription>
        </DialogHeader>

        {checkEmail ? (
          <p className="text-sm text-white/80 leading-relaxed">
            Check your inbox at <strong>{email}</strong> and click the link to confirm your account.
            {plan && ` We'll finish your ${PLAN_NAMES[plan]} signup when you're back.`}
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            <label htmlFor="agree-terms" className="flex items-start gap-2.5 text-sm text-white/75 leading-snug cursor-pointer">
              <Checkbox id="agree-terms" checked={agreed} onCheckedChange={(v) => setAgreed(v === true)} className="mt-0.5 border-white/30" />
              <span>
                I agree to the{" "}
                <a href="/terms" target="_blank" rel="noopener" className="underline text-[oklch(0.75_0.15_292)] hover:text-white">
                  Terms of Service
                </a>
                , including that all sales are final. Needed to create an account.
              </span>
            </label>

            <Button onClick={google} disabled={busy} className="bg-white text-[oklch(0.15_0.03_265)] hover:bg-white/90 font-semibold gap-2">
              <GoogleIcon /> Continue with Google
            </Button>

            <div className="flex items-center gap-3 text-xs text-white/40">
              <div className="h-px flex-1 bg-white/10" /> or use email <div className="h-px flex-1 bg-white/10" />
            </div>

            <Tabs value={tab} onValueChange={(v) => setTab(v as "signup" | "login")}>
              <TabsList className="w-full">
                <TabsTrigger value="signup">Sign up</TabsTrigger>
                <TabsTrigger value="login">Log in</TabsTrigger>
              </TabsList>
              <TabsContent value="signup" className="pt-3">{emailForm("signup")}</TabsContent>
              <TabsContent value="login" className="pt-3">{emailForm("login")}</TabsContent>
            </Tabs>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
