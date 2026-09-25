import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, Mic, User } from "lucide-react";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { saveSignupProfile, type SignupAnswers } from "@/utils/signupProfile";

const BLUE = "#1a5fb4";

/** Asked once. Dismissing only hides it for this browser session. */
const SESSION_SNOOZE_KEY = "comediq-onboarding-snoozed";

const yearsLabel = (y: number) =>
  y === 0 ? "Just started" : y >= 10 ? "10+ yrs" : `${y} ${y === 1 ? "yr" : "yrs"}`;
const spendLabel = (d: number) => (d >= 150 ? "$150+/wk" : `$${d}/wk`);
const showsLabel = (n: number) => (n >= 20 ? "20+ a year" : `${n} a year`);

const FIELD_WRAP =
  "flex items-center overflow-hidden rounded-xl border border-gray-400 bg-white/10 focus-within:border-[#1a5fb4] focus-within:ring-2 focus-within:ring-[#1a5fb4] dark:border-white/20";
const BARE_INPUT =
  "w-full min-w-0 bg-transparent py-3 pl-2 pr-3 text-sm outline-none placeholder-gray-600 dark:placeholder-white/40";

const SliderRow = ({
  label,
  value,
  display,
  onChange,
  max,
  step = 1,
  ariaLabel,
}: {
  label: string;
  value: number;
  display: string;
  onChange: (n: number) => void;
  max: number;
  step?: number;
  ariaLabel: string;
}) => (
  <div>
    <div className="flex items-baseline justify-between gap-2">
      <span className="text-xs font-medium text-[#07111f]/60 dark:text-white/70">{label}</span>
      <span className="text-sm font-bold" style={{ color: BLUE }}>
        {display}
      </span>
    </div>
    <Slider
      value={[value]}
      onValueChange={([next]) => onChange(next)}
      min={0}
      max={max}
      step={step}
      className="mt-2.5"
      aria-label={ariaLabel}
    />
  </div>
);

/**
 * The one questionnaire, shown on the first signed-in load and never again.
 *
 * It lives here rather than on the signup form for two reasons. Signing in
 * with Google never passes through that form, so anyone arriving that way was
 * skipping every question. And a wall of sliders in front of someone who has
 * not signed up yet is a reason to leave.
 *
 * profiles.is_comedian being NULL is the whole trigger. Answer once, either
 * way, and it is done.
 */
export default function ComedianOnboardingDialog() {
  const { user, needsOnboarding, refreshProfile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [isComedian, setIsComedian] = useState<boolean | null>(null);
  const [instagram, setInstagram] = useState("");
  const [years, setYears] = useState(2);
  const [spend, setSpend] = useState(30);
  const [affiliate, setAffiliate] = useState(false);
  const [showsPerYear, setShowsPerYear] = useState(6);
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
      /* private mode, so it asks again next load */
    }
    setSnoozed(true);
  };

  const save = async () => {
    if (!user || isComedian === null) return;
    setSaving(true);

    const answers: SignupAnswers = isComedian
      ? {
          name,
          isComedian: true,
          instagram,
          yearsPerforming: years,
          weeklyMicSpendUsd: spend,
          affiliateInterested: affiliate,
        }
      : { name, isComedian: false, showsSeenPerYear: showsPerYear };

    const result = await saveSignupProfile(user.id, answers);
    setSaving(false);

    if (!result.ok) {
      toast({
        title: "Could not save that",
        description: "You can add it on your profile instead.",
        variant: "destructive",
      });
      snooze();
      return;
    }

    refreshProfile();
    navigate(isComedian ? "/perform" : "/laugh");
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && snooze()}>
      <DialogContent className="max-w-sm rounded-2xl">
        <div>
          <h2 className="text-xl font-bold">Welcome to Comediq</h2>
          <p className="mt-1 text-sm text-[#07111f]/60 dark:text-white/60">
            Two quick things and you are in. We only ask this once.
          </p>

          <div className={`${FIELD_WRAP} mt-5`}>
            <User className="ml-3.5 h-4 w-4 shrink-0 text-gray-400" />
            <input
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={BARE_INPUT}
              autoComplete="name"
              maxLength={80}
            />
          </div>

          <div className="mt-2.5 grid grid-cols-2 gap-2">
            {(
              [
                { comedian: true, icon: Mic, label: "Comedian", hint: "I perform" },
                { comedian: false, icon: Eye, label: "Audience", hint: "I watch" },
              ] as const
            ).map(({ comedian, icon: Icon, label, hint }) => {
              const active = isComedian === comedian;
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => setIsComedian(comedian)}
                  aria-pressed={active}
                  className={`flex items-center gap-2.5 rounded-xl border-2 px-3 py-2.5 text-left transition-colors ${
                    active
                      ? "border-[#1a5fb4] bg-[#1a5fb4]/10"
                      : "border-[#07111f]/15 hover:bg-[#07111f]/[0.04] dark:border-white/15 dark:hover:bg-white/5"
                  }`}
                >
                  <Icon
                    className={`h-4 w-4 shrink-0 ${active ? "text-[#1a5fb4] dark:text-[#8ec5ff]" : "text-gray-400"}`}
                  />
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold leading-tight">{label}</span>
                    <span className="block text-[11px] leading-tight text-[#07111f]/50 dark:text-white/50">
                      {hint}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          {/* Nothing below appears until they have said which they are. */}
          {isComedian === true && (
            <div className="mt-2.5 space-y-4 rounded-xl border border-[#07111f]/15 p-4 dark:border-white/15">
              <div className={FIELD_WRAP}>
                <span className="ml-3.5 shrink-0 text-sm text-gray-400">@</span>
                <input
                  type="text"
                  placeholder="instagram"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  className={BARE_INPUT}
                  autoCapitalize="none"
                  autoCorrect="off"
                  maxLength={60}
                />
              </div>

              <SliderRow
                label="Doing comedy"
                value={years}
                display={yearsLabel(years)}
                onChange={setYears}
                max={10}
                ariaLabel="Years doing comedy"
              />
              <SliderRow
                label="Spent on mics"
                value={spend}
                display={spendLabel(spend)}
                onChange={setSpend}
                max={150}
                step={5}
                ariaLabel="Weekly spend on open mics"
              />
              <p className="text-[11px] leading-snug text-[#07111f]/50 dark:text-white/45">
                Covers, drinks, the whole night. A rough week is fine.
              </p>

              <label className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-[#07111f]/15 p-2.5 dark:border-white/15">
                <input
                  type="checkbox"
                  checked={affiliate}
                  onChange={(e) => setAffiliate(e.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-[#1a5fb4]"
                />
                <span className="min-w-0">
                  <span className="block text-xs font-semibold">Affiliate comedian</span>
                  <span className="block text-[11px] leading-snug text-[#07111f]/50 dark:text-white/45">
                    I will post one Comediq story a month, to be considered for shows and
                    bookings.
                  </span>
                </span>
              </label>
            </div>
          )}

          {isComedian === false && (
            <div className="mt-2.5 rounded-xl border border-[#07111f]/15 p-4 dark:border-white/15">
              <SliderRow
                label="Comedy shows you see"
                value={showsPerYear}
                display={showsLabel(showsPerYear)}
                onChange={setShowsPerYear}
                max={20}
                ariaLabel="Comedy shows seen per year"
              />
              <p className="mt-2 text-[11px] leading-snug text-[#07111f]/50 dark:text-white/45">
                Roughly, over a year. It tunes what we put in front of you.
              </p>
            </div>
          )}

          <button
            type="button"
            disabled={saving || isComedian === null}
            onClick={save}
            className="mt-4 w-full rounded-xl py-3 text-sm font-semibold text-[#fff] transition-opacity disabled:opacity-40"
            style={{ background: BLUE }}
          >
            {saving ? "Saving…" : isComedian === null ? "Pick one to continue" : "Done"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
