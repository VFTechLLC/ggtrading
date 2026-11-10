/* Member accounts: who is signed in, which plan they joined, and the sign-in dialog.
   Agreeing to the Terms in the dialog is remembered and saved to the profile after sign-in.
   Joining a plan while signed out remembers the plan, opens the dialog, and finishes
   the signup after sign-in (also after Google's redirect or an email confirmation link). */

import AuthDialog from "@/components/AuthDialog";
import { callFunction, PLAN_NAMES, supabase, type Plan } from "@/lib/supabase";
import { TERMS_VERSION } from "@/lib/terms";
import type { User } from "@supabase/supabase-js";
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";

const PENDING_PLAN_KEY = "gg-pending-plan";
const PENDING_TERMS_KEY = "gg-pending-terms";

interface AuthState {
  user: User | null;
  plan: Plan | null;
  openAuth: (plan?: Plan) => void;
  join: (plan: Plan) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

const readPendingPlan = (): Plan | null => {
  try {
    const p = localStorage.getItem(PENDING_PLAN_KEY);
    return p === "free" || p === "pro" || p === "elite" ? p : null;
  } catch {
    return null;
  }
};
/** Called by the dialog when someone ticks the Terms box, so it survives Google's redirect. */
export const rememberTermsAccepted = () => {
  try {
    localStorage.setItem(PENDING_TERMS_KEY, TERMS_VERSION);
  } catch {
    // private browsing: email signups still carry it in their user metadata
  }
};
const takePendingTerms = (): string | null => {
  try {
    const version = localStorage.getItem(PENDING_TERMS_KEY);
    localStorage.removeItem(PENDING_TERMS_KEY);
    return version;
  } catch {
    return null;
  }
};

const writePendingPlan = (plan: Plan | null) => {
  try {
    if (plan) localStorage.setItem(PENDING_PLAN_KEY, plan);
    else localStorage.removeItem(PENDING_PLAN_KEY);
  } catch {
    // private browsing: the plan just isn't remembered across the redirect
  }
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogPlan, setDialogPlan] = useState<Plan | null>(null);
  const joining = useRef(false);

  const loadPlan = useCallback(async (u: User | null) => {
    if (!u) return setPlan(null);
    const { data } = await supabase.from("profiles").select("plan, terms_version").eq("id", u.id).maybeSingle();
    setPlan((data?.plan as Plan | null) ?? null);
    // Save the Terms acceptance once: from the ticked box (any sign-in) or the email signup's metadata.
    const accepted = takePendingTerms() ?? (u.user_metadata?.terms_version as string | undefined) ?? null;
    if (data && accepted && data.terms_version !== accepted) {
      await supabase
        .from("profiles")
        .update({ terms_version: accepted, terms_accepted_at: new Date().toISOString() })
        .eq("id", u.id);
    }
  }, []);

  const submitPlan = useCallback(async (p: Plan) => {
    if (joining.current) return;
    joining.current = true;
    try {
      // Paid plans go to Stripe Checkout when online payment is on for this member; otherwise the plan is just saved.
      if (p === "pro" || p === "elite") {
        const checkout = await callFunction<{ enabled: boolean; url?: string }>("billing-checkout", { plan: p });
        if (checkout.enabled && checkout.url) {
          writePendingPlan(null);
          window.location.assign(checkout.url);
          return;
        }
      }
      const result = await callFunction<{ alreadyMember?: boolean }>("membership", { plan: p });
      setPlan(p);
      writePendingPlan(null);
      toast.success(
        result.alreadyMember
          ? `You're already on the ${PLAN_NAMES[p]} plan.`
          : `You're signed up for ${PLAN_NAMES[p]}! Check your email for a confirmation.`,
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't save your plan. Please try again.");
    } finally {
      joining.current = false;
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      void loadPlan(data.session?.user ?? null);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      void loadPlan(u);
      if (event === "SIGNED_IN" && u) {
        setDialogOpen(false);
        const pending = readPendingPlan();
        // Supabase calls this listener while holding its auth lock; call the function afterwards.
        if (pending) setTimeout(() => void submitPlan(pending), 0);
      }
    });
    return () => sub.subscription.unsubscribe();
  }, [loadPlan, submitPlan]);

  const openAuth = useCallback((p?: Plan) => {
    setDialogPlan(p ?? null);
    writePendingPlan(p ?? null);
    setDialogOpen(true);
  }, []);

  const join = useCallback(
    async (p: Plan) => {
      if (user) await submitPlan(p);
      else openAuth(p);
    },
    [user, submitPlan, openAuth],
  );

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    toast.info("You've been logged out.");
  }, []);

  return (
    <AuthContext.Provider value={{ user, plan, openAuth, join, signOut }}>
      {children}
      <AuthDialog open={dialogOpen} onOpenChange={setDialogOpen} plan={dialogPlan} />
    </AuthContext.Provider>
  );
}
