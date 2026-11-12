/* "Set a new password": opens when someone arrives from the reset link in a "forgot password" email
   (Supabase signs them in for this one purpose and fires PASSWORD_RECOVERY). Same look as the sign-in dialog. */

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";

export default function ResetPasswordDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function save(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) return toast.error(error.message);
    setPassword("");
    toast.success("Your password is updated. You're logged in.");
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="bg-[oklch(0.10_0.04_265)] border-white/10 text-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Set a new password</DialogTitle>
          <DialogDescription className="text-white/60">Choose a new password for your GG Trading account.</DialogDescription>
        </DialogHeader>
        <form className="flex flex-col gap-3" onSubmit={(e) => void save(e)}>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="new-password">New password</Label>
            <Input id="new-password" type="password" autoComplete="new-password" minLength={8} required value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <Button type="submit" disabled={busy} className="bg-[oklch(0.48_0.26_292)] hover:bg-[oklch(0.55_0.26_292)] text-white font-semibold">
            Save new password
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
