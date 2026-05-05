import { useState } from "react";
import { Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { submitBookingOpportunitySignup } from "@/api/bookingOpportunitySignups";
import type { GrowthOpportunity } from "@/api/growthOpportunities";

interface BookingSignupDialogProps {
  opportunity: GrowthOpportunity;
}

const isYoutubeUrl = (value: string) => {
  if (!value.trim()) return false;
  try {
    const host = new URL(value).hostname.replace(/^www\./, "");
    return host === "youtube.com" || host.endsWith(".youtube.com") || host === "youtu.be";
  } catch {
    return false;
  }
};

export function BookingSignupDialog({ opportunity }: BookingSignupDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: user?.user_metadata?.full_name?.toString() || user?.user_metadata?.username?.toString() || "",
    phone: user?.phone || "",
    yearsDoingStandup: "",
    performsFivePlusWeekly: "",
    bestCredit: "",
    youtubeUrl: "",
  });

  const update = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const submit = async (mode: "account" | "manual") => {
    if (mode === "manual") {
      if (!form.name.trim() || !form.phone.trim() || !form.yearsDoingStandup.trim() || !form.bestCredit.trim()) {
        toast({ title: "Missing details", description: "Name, phone, years, and best credit are required.", variant: "destructive" });
        return;
      }
      if (!form.performsFivePlusWeekly) {
        toast({ title: "Missing detail", description: "Please answer whether you do stand up 5+ times per week.", variant: "destructive" });
        return;
      }
      if (!isYoutubeUrl(form.youtubeUrl)) {
        toast({ title: "YouTube link needed", description: "Add a public or unlisted YouTube link to your tight 5 tape.", variant: "destructive" });
        return;
      }
    }

    setSubmitting(true);
    try {
      await submitBookingOpportunitySignup({
        opportunityId: opportunity.id,
        opportunityTitle: opportunity.title,
        userId: user?.id ?? null,
        signupMode: mode,
        name: mode === "manual" ? form.name : undefined,
        phone: mode === "manual" ? form.phone : undefined,
        yearsDoingStandup: mode === "manual" ? form.yearsDoingStandup : undefined,
        performsFivePlusWeekly: mode === "manual" ? form.performsFivePlusWeekly === "yes" : null,
        bestCredit: mode === "manual" ? form.bestCredit : undefined,
        youtubeUrl: mode === "manual" ? form.youtubeUrl : undefined,
      });
      toast({ title: "Signup submitted", description: "Your booking signup was sent." });
      setOpen(false);
    } catch (error) {
      console.error("Booking signup error", error);
      toast({ title: "Could not submit", description: "Try again in a moment.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full mt-3">
          <Send className="h-3.5 w-3.5 mr-2" />
          Sign Up
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Sign up for this booking</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {user && (
            <div className="rounded-md border bg-muted/40 p-3 space-y-3">
              <p className="text-sm text-muted-foreground">
                Submit with your logged-in Comediq account, or add show-specific details below.
              </p>
              <Button className="w-full" onClick={() => submit("account")} disabled={submitting}>
                {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Use my Comediq account
              </Button>
            </div>
          )}

          <div className="space-y-3">
            {user && <p className="text-xs uppercase tracking-wide text-muted-foreground">Or add details now</p>}
            <div>
              <Label>Name *</Label>
              <Input value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="Your stage or legal name" />
            </div>
            <div>
              <Label>Phone number *</Label>
              <Input type="tel" value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="(212) 555-1234" />
            </div>
            <div>
              <Label>Years doing stand up *</Label>
              <Input value={form.yearsDoingStandup} onChange={(e) => update("yearsDoingStandup", e.target.value)} placeholder="e.g. 3 years" />
            </div>
            <div>
              <Label>Do you do stand up 5+ times per week? *</Label>
              <Select value={form.performsFivePlusWeekly} onValueChange={(value) => update("performsFivePlusWeekly", value)}>
                <SelectTrigger><SelectValue placeholder="Select one" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Best credit *</Label>
              <Input value={form.bestCredit} onChange={(e) => update("bestCredit", e.target.value)} placeholder="Festival, club, show, producer, etc." />
            </div>
            <div>
              <Label>Public or unlisted YouTube link to your tight 5 *</Label>
              <Input type="url" value={form.youtubeUrl} onChange={(e) => update("youtubeUrl", e.target.value)} placeholder="https://youtu.be/..." />
            </div>
            <Button className="w-full" onClick={() => submit("manual")} disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Submit signup
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
