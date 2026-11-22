import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Building2, Instagram, Trophy, UserPlus } from "lucide-react";

import SEO from "@/components/SEO";
import { VenueBubble, VenueName } from "@/components/v3/V3Primitives";
import { useAuth } from "@/contexts/AuthContext";
import { useComedianProfile } from "@/hooks/useComedianProfile";
import { useIsDesktop } from "@/hooks/useIsDesktop";
import { useMySets } from "@/hooks/useMySets";
import { v3colors, V3_DISPLAY_STYLE } from "@/theme/v3";
import { initialsOf } from "@/utils/venues";

/**
 * Profile, from Main.dc.html's PROFILE board.
 *
 * Desktop splits it in two, per WEB_AND_HOST_PLAN.md: "Left: avatar, stats
 * card, refer buttons. Right: past mics grid."
 *
 * The boards show "Mics 142 / Sets 188 / Venues 37". Those are counted from
 * the comic's own `recordings` rows rather than invented: sets is the row
 * count, venues is the distinct venue count. There is no per-mic attendance
 * record separate from recordings, so "Mics" would be the same number as Sets
 * - it is left out rather than shown twice under two names.
 */

function Label({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[17px] font-semibold" style={{ color: v3colors.ink }}>
      {children}
    </span>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <div className="text-sm" style={{ color: v3colors.muted }}>
        {label}
      </div>
      <div className="text-[34px] font-extrabold">{value}</div>
    </div>
  );
}

export default function V3Profile() {
  const isDesktop = useIsDesktop();
  const { user } = useAuth();
  const { data: profile } = useComedianProfile(user?.id);
  const { data: sets = [] } = useMySets();

  const name =
    profile?.stage_name?.trim() ||
    (user?.user_metadata as { full_name?: string } | undefined)?.full_name ||
    user?.email?.split("@")[0] ||
    "You";

  const stats = useMemo(() => {
    const venues = new Set(
      sets.map((set) => set.venueName?.trim()).filter((venue): venue is string => Boolean(venue)),
    );
    const withRecording = sets.filter((set) => set.fileUrl).length;
    return { sets: sets.length, venues: venues.size, recorded: withRecording };
  }, [sets]);

  const mostPlayed = useMemo(() => {
    const counts = new Map<string, number>();
    for (const set of sets) {
      const venue = set.venueName?.trim();
      if (!venue) continue;
      counts.set(venue, (counts.get(venue) ?? 0) + 1);
    }
    let best: string | null = null;
    let bestCount = 0;
    for (const [venue, count] of counts) {
      if (count > bestCount) {
        bestCount = count;
        best = venue;
      }
    }
    return best;
  }, [sets]);

  // AppUser carries only id/email/phone/metadata, so "member since" comes
  // from the profiles row, which does have created_at.
  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      })
    : null;

  if (!user) {
    return (
      <div className="min-h-screen px-6 pb-40 pt-20 font-dmsans" style={{ background: v3colors.cream }}>
        <SEO title="Your profile | Comediq" description="Your comic profile on Comediq." />
        <h1 style={{ ...V3_DISPLAY_STYLE, fontSize: 36, color: v3colors.ink }}>Profile</h1>
        <p className="mt-2 text-[17px]" style={{ color: v3colors.muted }}>
          Sign in to see your stats and the mics you have done.
        </p>
        <Link
          to="/auth/sign-in?next=/v3/profile"
          className="mt-5 inline-flex h-12 items-center rounded-full px-6 font-bold text-white"
          style={{ background: v3colors.royal }}
        >
          Sign in
        </Link>
      </div>
    );
  }

  const header = (
    <>
      {profile?.headshot_url ? (
        <img
          src={profile.headshot_url}
          alt=""
          className="h-30 w-30 rounded-full object-cover"
          style={{ width: 120, height: 120 }}
        />
      ) : (
        <div
          aria-hidden="true"
          className="flex items-center justify-center rounded-full text-[42px] font-bold"
          style={{ width: 120, height: 120, background: v3colors.sky, color: v3colors.ink }}
        >
          {initialsOf(name)}
        </div>
      )}
      <h1 className="mb-1.5 mt-5" style={{ ...V3_DISPLAY_STYLE, fontSize: 36, color: v3colors.ink }}>
        {name}
      </h1>
      {profile?.instagram && (
        <a
          href={`https://instagram.com/${profile.instagram.replace(/^@/, "")}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-lg"
          style={{ color: v3colors.muted }}
        >
          <Instagram className="h-5 w-5" aria-hidden="true" />
          {profile.instagram.replace(/^@/, "")}
        </a>
      )}
    </>
  );

  const referButtons = (
    <div className="mt-6 grid grid-cols-2 gap-3">
      <Link
        to="/perform"
        className="flex h-[60px] items-center justify-center gap-2 rounded-[22px] bg-white text-[17px] font-bold shadow-[0_6px_18px_rgba(18,26,51,0.08)]"
        style={{ color: v3colors.royal }}
      >
        <UserPlus className="h-5 w-5" aria-hidden="true" />
        Refer a comic
      </Link>
      <Link
        to="/v3/listing"
        className="flex h-[60px] items-center justify-center gap-2 rounded-[22px] bg-white text-[17px] font-bold shadow-[0_6px_18px_rgba(18,26,51,0.08)]"
        style={{ color: v3colors.royal }}
      >
        <Building2 className="h-5 w-5" aria-hidden="true" />
        Refer a venue
      </Link>
    </div>
  );

  const statsCard = (
    <section
      className="mt-5 rounded-[28px] p-[22px]"
      style={{ background: v3colors.surfaceSunken }}
    >
      <Label>Comic stats</Label>
      {memberSince && (
        <div className="mt-3.5 flex items-center gap-2 text-lg font-medium">
          <Trophy className="h-5 w-5" aria-hidden="true" />
          Member since {memberSince}
        </div>
      )}
      <div className="mt-4 grid grid-cols-3 gap-2.5">
        <Stat label="Sets" value={stats.sets} />
        <Stat label="Venues" value={stats.venues} />
        <Stat label="Recorded" value={stats.recorded} />
      </div>
      {mostPlayed && (
        <div
          className="mt-4 flex items-center justify-between pt-3.5 text-base"
          style={{ borderTop: `1px solid ${v3colors.borderField}` }}
        >
          <span style={{ color: v3colors.muted }}>Most played venue</span>
          <VenueName className="text-base" style={{ color: v3colors.ink }}>
            {mostPlayed}
          </VenueName>
        </div>
      )}
    </section>
  );

  const pastMics = (
    <>
      <h2 className="mb-3.5 mt-7 text-[22px] font-bold" style={{ color: v3colors.ink }}>
        Past mics
      </h2>
      {sets.length === 0 ? (
        <p className="text-[15px]" style={{ color: v3colors.muted }}>
          Nothing here yet. Record a set and it shows up.
        </p>
      ) : isDesktop ? (
        <div className="grid grid-cols-2 gap-3.5 xl:grid-cols-3">
          {sets.map((set) => {
            const seed = set.venueName?.trim() || set.id;
            return (
              <Link
                key={set.id}
                to={`/v3/sets/${set.id}`}
                className="flex flex-col items-center gap-1 rounded-[28px] bg-white px-3.5 py-5 shadow-[0_6px_18px_rgba(18,26,51,0.06)]"
                style={{ border: `1px solid ${v3colors.borderSoft}` }}
              >
                <VenueBubble seed={seed} initials={initialsOf(seed)} size={92} ring={false} />
                <VenueName className="mt-2.5 text-center text-base" style={{ color: v3colors.ink }}>
                  {set.venueName ?? set.title ?? "Untitled"}
                </VenueName>
                <div className="text-sm" style={{ color: v3colors.muted }}>
                  {new Date(set.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="-mx-6 flex gap-3.5 overflow-x-auto px-6 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {sets.map((set) => {
            const seed = set.venueName?.trim() || set.id;
            return (
              <Link
                key={set.id}
                to={`/v3/sets/${set.id}`}
                className="flex w-[170px] shrink-0 flex-col items-center gap-1 rounded-[28px] bg-white px-3.5 py-5 shadow-[0_6px_18px_rgba(18,26,51,0.06)]"
                style={{ border: `1px solid ${v3colors.borderSoft}` }}
              >
                <VenueBubble seed={seed} initials={initialsOf(seed)} size={92} ring={false} />
                <VenueName className="mt-2.5 text-center text-base" style={{ color: v3colors.ink }}>
                  {set.venueName ?? set.title ?? "Untitled"}
                </VenueName>
                <div className="text-sm" style={{ color: v3colors.muted }}>
                  {new Date(set.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );

  return (
    <div className="min-h-screen font-dmsans" style={{ background: v3colors.cream }}>
      <SEO title={`${name} | Comediq`} description="Your comic profile on Comediq." />

      {isDesktop ? (
        <div className="mx-auto grid max-w-6xl grid-cols-[380px_1fr] gap-10 px-8 py-8">
          <div>
            {header}
            {referButtons}
            {statsCard}
          </div>
          <div>{pastMics}</div>
        </div>
      ) : (
        <div className="px-6 pb-40 pt-20">
          {header}
          {referButtons}
          {statsCard}
          {pastMics}
        </div>
      )}
    </div>
  );
}
