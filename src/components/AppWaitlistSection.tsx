import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

const schema = z.object({
  email: z.string().trim().email({ message: "Enter a valid email" }).max(255),
  instagram: z.string().trim().max(100).optional(),
  years_doing_comedy: z.string().min(1, { message: "Select years in comedy" }),
});

const AppWaitlistSection = () => {
  const [email, setEmail] = useState("");
  const [instagram, setInstagram] = useState("");
  const [years, setYears] = useState("");
  const [interests, setInterests] = useState({
    affiliate: false,
    beta: false,
    showcase: false,
    curious: false,
  });
  const [submitting, setSubmitting] = useState(false);

  const toggle = (key: keyof typeof interests) =>
    setInterests((p) => ({ ...p, [key]: !p[key] }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({
      email,
      instagram: instagram || undefined,
      years_doing_comedy: years,
    });
    if (!parsed.success) {
      toast({
        title: "Check your info",
        description: parsed.error.issues[0]?.message ?? "Invalid input",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    const { error } = await (supabase as any).from("App_waitlist").insert({
      email: parsed.data.email,
      instagram: parsed.data.instagram ?? null,
      years_doing_comedy: parsed.data.years_doing_comedy,
      interested_affiliate: interests.affiliate,
      interested_beta_tester: interests.beta,
      interested_showcase_booking: interests.showcase,
      just_curious: interests.curious,
    });
    setSubmitting(false);

    if (error) {
      toast({
        title: "Something went wrong",
        description: "Please try again.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "You're on the list! 🎤",
      description: "We'll be in touch soon.",
    });
    setEmail("");
    setInstagram("");
    setYears("");
    setInterests({ affiliate: false, beta: false, showcase: false, curious: false });
  };

  return (
    <section
      id="app-waitlist"
      className="px-4 py-8"
    >
      <div className="max-w-2xl mx-auto rounded-2xl bg-[#102a53]/78 p-5 text-white shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_22px_80px_rgba(2,10,30,0.34)] backdrop-blur-xl transition-transform duration-300 hover:scale-[1.01]">
        <div className="text-center mb-5">
          <span className="inline-block text-xs font-semibold text-[#8ec5ff] uppercase tracking-wide mb-2">
            Coming Soon
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
            Join the Comediq App Waitlist
          </h2>
          <p className="text-sm sm:text-base text-white/68">
            Be first in line when the app drops.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl bg-white/10 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label htmlFor="aw-email" className="text-sm text-white/84">Email *</Label>
              <Input
                id="aw-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="aw-ig" className="text-sm text-white/84">Instagram</Label>
              <Input
                id="aw-ig"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                placeholder="@handle"
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <Label className="text-sm text-white/84">Years doing comedy *</Label>
            <Select value={years} onValueChange={setYears}>
              <SelectTrigger className="mt-1 h-10">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0-1">0-1 years</SelectItem>
                <SelectItem value="1-3">1-3 years</SelectItem>
                <SelectItem value="3-5">3-5 years</SelectItem>
                <SelectItem value="5-10">5-10 years</SelectItem>
                <SelectItem value="10+">10+ years</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-sm text-white/84">I'm interested in...</Label>
            {[
              { key: "affiliate" as const, label: "Being an affiliate comedian for Comediq" },
              { key: "beta" as const, label: "Being a Comediq beta tester" },
              { key: "showcase" as const, label: "Getting booked on Comediq showcase shows" },
              { key: "curious" as const, label: "Nothing lol I just want to see the app" },
            ].map((opt) => (
              <label
                key={opt.key}
                className="flex items-start gap-2 cursor-pointer text-sm text-white/72"
              >
                <Checkbox
                  checked={interests[opt.key]}
                  onCheckedChange={() => toggle(opt.key)}
                  className="mt-0.5"
                />
                <span>{opt.label}</span>
              </label>
            ))}
          </div>

          <Button
            type="submit"
            disabled={submitting}
            className="w-full bg-[#1a5fb4] hover:bg-[#164d94] text-white py-3 rounded-full"
          >
            {submitting ? "Joining..." : "Join the Waitlist"}
          </Button>
        </form>
      </div>
    </section>
  );
};

export default AppWaitlistSection;
