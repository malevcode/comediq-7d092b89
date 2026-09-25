import { useState } from "react";
import { Mic, Users } from "lucide-react";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const BLUE = "#1a5fb4";

/** Asked once, so it is kept to one question and a slider. */
const SESSION_SNOOZE_KEY = "comedian-onboarding-snoozed";

const yearsLabel = (years: number) => {
  if (years === 0) return "Just started";
  if (years >= 10) return "10+ years";
  return `${years} ${years === 1 ? "year" : "years"}`;
};

/**
 * One question at signup: are you a comedian, and if so how long have you been
 * doing it. The answer lands on the profile, so the prompt never returns.
 *
 * It sits over whatever page you landed on rather than taking a route of its
 * own, so the mic list stays visible behind it and answering does not cost a
 * navigation.
 */
export default function ComedianOnboardingDialog() {
  const { user, needsOnboarding, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [years, setYears] = useState(2);
  const [askingYears, setAskingYears] = useState(false);
  const [saving, setSaving] = useState(false);
  const [snoozed, setSnoozed] = useState(() => {
    try {
      return sessionStorage.getItem(SESSION_SNOOZE_KEY) === "1";
    } catch {
      return false;
    }
  });

  const open = needsOnboarding && !snoozed;

  const snooze = () => {
    try {
      sessionStorage.setItem(SESSION_SNOOZE_KEY, "1");
    } catch {
      /* private mode, so it just asks again next load */
    }
    setSnoozed(true);
  };

  const save = async (isComedian: boolean, yearsPerforming?: number) => {
    if (!user) return;
    setSaving(true);

    const { error } = await supabase
      .from("profiles")
      .update(
        isComedian
          ? { is_comedian: true, years_performing: yearsPerforming ?? 0 }
          : { is_comedian: false },
      )
      .eq("user_id", user.id);

    setSaving(false);

    if (error) {
      toast({
        title: "Could not save that",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    refreshProfile();
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && snooze()}>
      <DialogContent className="max-w-sm rounded-2xl">
        {askingYears ? (
          <div>
            <h2 className="text-xl font-bold">How long have you been doing comedy?</h2>
            <p className="mt-1 text-sm text-[#07111f]/60 dark:text-white/60">
              Drag the slider. Nobody else sees this unless you fill in a profile.
            </p>

            <div className="mt-7 text-center">
              <span className="text-3xl font-bold" style={{ color: BLUE }}>
                {yearsLabel(years)}
              </span>
            </div>

            <div className="mt-5">
              <Slider
                value={[years]}
                onValueChange={([next]) => setYears(next)}
                min={0}
                max={10}
                step={1}
                aria-label="Years doing comedy"
              />
              <div className="mt-2 flex justify-between text-xs text-[#07111f]/50 dark:text-white/50">
                <span>0</span>
                <span>10+</span>
              </div>
            </div>

            <button
              type="button"
              disabled={saving}
              onClick={() => save(true, years)}
              className="mt-7 w-full rounded-xl py-3 text-sm font-semibold text-[#fff] transition-opacity disabled:opacity-50"
              style={{ background: BLUE }}
            >
              {saving ? "Saving…" : "Done"}
            </button>
          </div>
        ) : (
          <div>
            <h2 className="text-xl font-bold">Are you a comedian?</h2>
            <p className="mt-1 text-sm text-[#07111f]/60 dark:text-white/60">
              One question, then you are back to the mics.
            </p>

            <div className="mt-6 space-y-2.5">
              <button
                type="button"
                disabled={saving}
                onClick={() => setAskingYears(true)}
                className="flex w-full items-center gap-3 rounded-xl border-2 p-4 text-left transition-colors disabled:opacity-50"
                style={{ borderColor: BLUE, backgroundColor: `${BLUE}14` }}
              >
                <Mic className="h-5 w-5 shrink-0" style={{ color: BLUE }} />
                <span>
                  <span className="block text-sm font-semibold">Yes, I perform</span>
                  <span className="block text-xs text-[#07111f]/60 dark:text-white/60">
                    Open mics, showcases, whatever stage will have me
                  </span>
                </span>
              </button>

              <button
                type="button"
                disabled={saving}
                onClick={() => save(false)}
                className="flex w-full items-center gap-3 rounded-xl border-2 border-[#07111f]/15 p-4 text-left transition-colors hover:bg-[#07111f]/[0.04] disabled:opacity-50 dark:border-white/15 dark:hover:bg-white/5"
              >
                <Users className="h-5 w-5 shrink-0 text-[#07111f]/40 dark:text-white/40" />
                <span>
                  <span className="block text-sm font-semibold">No, I just watch</span>
                  <span className="block text-xs text-[#07111f]/60 dark:text-white/60">
                    Here to find shows worth going to
                  </span>
                </span>
              </button>
            </div>

            <button
              type="button"
              onClick={snooze}
              className="mt-4 w-full text-center text-xs text-[#07111f]/45 underline underline-offset-2 dark:text-white/45"
            >
              Not now
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
