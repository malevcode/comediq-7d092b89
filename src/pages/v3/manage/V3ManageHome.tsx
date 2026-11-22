import { Link, useNavigate } from "react-router-dom";
import { ChevronRight, Settings } from "lucide-react";

import SEO from "@/components/SEO";
import { StageTile, VenueBubble } from "@/components/v3/V3Primitives";
import { useAuth } from "@/contexts/AuthContext";
import { useIsDesktop } from "@/hooks/useIsDesktop";
import { useComedianProfile } from "@/hooks/useComedianProfile";
import { useMyListings, type HostListing } from "@/hooks/useMyListings";
import { V3_DISPLAY_STYLE } from "@/theme/v3";
import { initialsOf } from "@/utils/venues";
import "./manage.css";

/**
 * Manage home, from HostManage.dc.html board 1, with the desktop sidebar from
 * WebManage.dc.html.
 *
 * Shown only to hosts — the Manage tab itself is gated by useIsHost, and this
 * screen says so plainly if someone reaches it with no listings.
 *
 * "Your listings": one card per mic or show with its status (Live / Pending),
 * the schedule line, and the dates-skipped chip.
 */

function scheduleLine(listing: HostListing): string {
  const { mic } = listing;
  const parts: string[] = [];
  if (mic.day) parts.push(`${mic.day}s`);
  if (mic.startTime) parts.push(mic.startTime);
  const when = parts.join(" ");
  const where = [mic.venueName, mic.neighborhood].filter(Boolean).join(", ");
  return [when, where].filter(Boolean).join(" · ");
}

function skipChip(listing: HostListing): string | null {
  const today = new Date().toISOString().slice(0, 10);
  const upcoming = listing.skips.filter((skip) => skip.skip_date >= today);
  if (upcoming.length === 0) return null;
  return upcoming.length === 1 ? "1 date skipped" : `${upcoming.length} dates skipped`;
}

function StatusPill({ isPending }: { isPending: boolean }) {
  return (
    <span className={`status${isPending ? " status--pending" : ""}`}>
      <i />
      {isPending ? "Pending" : "Live"}
    </span>
  );
}

/** The big photo card the board uses for the first listing. */
function HeroListingCard({ listing }: { listing: HostListing }) {
  const seed = listing.mic.venueName || listing.mic.openMic;
  const chip = skipChip(listing);

  return (
    <Link
      to={`/v3/manage/${encodeURIComponent(listing.mic.uniqueIdentifier)}`}
      className="relative block h-[250px] overflow-hidden rounded-[24px]"
    >
      {listing.mic.coverImageUrl ? (
        <img src={listing.mic.coverImageUrl} alt="" className="h-full w-full object-cover" />
      ) : (
        <StageTile seed={seed} className="h-full w-full" />
      )}
      {/* The board fades the bottom so the title reads over any photo. */}
      <span
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-3/5"
        style={{ background: "linear-gradient(rgba(8,20,43,0), rgba(8,20,43,.88))" }}
      />
      <span className="absolute right-3.5 top-3.5">
        <StatusPill isPending={listing.isPending} />
      </span>
      <div className="absolute inset-x-4 bottom-3.5">
        <div className="lf text-[22px]">{listing.mic.openMic}</div>
        <div className="mt-1 text-[13px]" style={{ color: "#DCE3F2" }}>
          {scheduleLine(listing)}
        </div>
        {chip && (
          <div className="mt-2.5 text-[13px]" style={{ color: "#FFC9C0" }}>
            {chip}
          </div>
        )}
      </div>
    </Link>
  );
}

/** The compact row the board uses for the rest. */
function ListingRow({ listing }: { listing: HostListing }) {
  const seed = listing.mic.venueName || listing.mic.openMic;
  const chip = skipChip(listing);

  return (
    <Link
      to={`/v3/manage/${encodeURIComponent(listing.mic.uniqueIdentifier)}`}
      className="card mt-2.5 flex items-center gap-3 px-3.5 py-3"
    >
      <VenueBubble
        seed={seed}
        initials={initialsOf(seed)}
        iconUrl={listing.mic.mapIconUrl}
        isComediqRun={listing.mic.isComediqRun}
        size={46}
      />
      <div className="min-w-0 flex-1">
        <div className="lf truncate text-[15px]">{listing.mic.openMic}</div>
        <div className="truncate text-[13px]" style={{ color: "#AEB9D6" }}>
          {[scheduleLine(listing), chip].filter(Boolean).join(" · ")}
        </div>
      </div>
      <StatusPill isPending={listing.isPending} />
    </Link>
  );
}

export default function V3ManageHome() {
  const isDesktop = useIsDesktop();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: profile } = useComedianProfile(user?.id);
  const { listings, isLoading } = useMyListings();

  const hostName =
    profile?.stage_name?.trim() || user?.email?.split("@")[0] || "You";
  const countLabel =
    listings.length === 1 ? "Hosting 1 listing" : `Hosting ${listings.length} listings`;

  const newListingButton = (
    <button type="button" className="btn-outline mt-3" onClick={() => navigate("/v3/listing")}>
      + List a new mic or show
    </button>
  );

  const profileCard = (
    <Link to="/v3/profile" className="card flex items-center gap-3.5 px-4 py-3.5">
      <span
        className="flex h-14 w-14 items-center justify-center rounded-full text-lg font-bold"
        style={{ background: "#8FC2F5", color: "#08142B" }}
      >
        {initialsOf(hostName)}
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[17px] font-semibold">{hostName}</div>
        <div className="text-[13px]" style={{ color: "#AEB9D6" }}>
          {countLabel}
        </div>
      </div>
      <span
        className="flex h-8 w-8 items-center justify-center rounded-full"
        style={{ border: "1px solid rgba(255,255,255,.3)" }}
        aria-hidden="true"
      >
        <ChevronRight className="h-4 w-4" />
      </span>
    </Link>
  );

  const empty = (
    <div className="card mt-3 p-5">
      <p className="text-[17px] font-semibold">No listings yet</p>
      <p className="mt-1.5 text-[15px]" style={{ color: "#AEB9D6" }}>
        List a mic or a show and it appears here, with its dates and stats.
      </p>
      {newListingButton}
    </div>
  );

  /* ------------------------------- desktop ------------------------------- */

  if (isDesktop) {
    return (
      <div className="mg-root">
        <SEO title="Manage your listings | Comediq" description="Your mics and shows on Comediq." />
        <div className="flex min-h-screen">
          <aside
            className="w-[300px] shrink-0 px-4.5 py-5.5"
            style={{ borderRight: "1px solid rgba(255,255,255,.08)", padding: "22px 18px" }}
          >
            <div className="mb-5.5 flex items-center gap-3" style={{ marginBottom: 22 }}>
              <span
                className="flex h-11 w-11 items-center justify-center rounded-full font-bold"
                style={{ background: "#8FC2F5", color: "#08142B" }}
              >
                {initialsOf(hostName)}
              </span>
              <div className="min-w-0">
                <div className="truncate text-[15px] font-semibold">{hostName}</div>
                <div className="text-[13px]" style={{ color: "#AEB9D6" }}>
                  {countLabel}
                </div>
              </div>
            </div>

            <div className="h">Your listings</div>
            <div className="flex flex-col gap-1.5">
              {listings.map((listing) => (
                <Link
                  key={listing.mic.uniqueIdentifier}
                  to={`/v3/manage/${encodeURIComponent(listing.mic.uniqueIdentifier)}`}
                  className="rounded-[14px] p-3"
                >
                  <div className="lf truncate text-[15px]">{listing.mic.openMic}</div>
                  <div className="mt-0.5 text-xs" style={{ color: "#AEB9D6" }}>
                    {[
                      listing.mic.day ? `${listing.mic.day}s` : null,
                      listing.mic.startTime,
                      listing.isPending ? "Pending" : "Live",
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </div>
                </Link>
              ))}
            </div>
            {newListingButton}
          </aside>

          <main className="min-w-0 flex-1 px-7 py-5.5" style={{ padding: "22px 28px" }}>
            <h1 style={{ ...V3_DISPLAY_STYLE, fontSize: 28 }}>Manage</h1>
            <p className="mt-2 text-[15px]" style={{ color: "#AEB9D6" }}>
              Pick a listing to edit it, turn dates on or off, and see its stats.
            </p>

            {isLoading && (
              <p className="mt-6 text-[15px]" style={{ color: "#AEB9D6" }}>
                Loading your listings…
              </p>
            )}
            {!isLoading && listings.length === 0 && empty}

            {listings.length > 0 && (
              <div className="mt-6 grid grid-cols-2 gap-4 xl:grid-cols-3">
                {listings.map((listing) => (
                  <HeroListingCard key={listing.mic.uniqueIdentifier} listing={listing} />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    );
  }

  /* -------------------------------- phone -------------------------------- */

  const [first, ...rest] = listings;

  return (
    <div className="mg-root mg-screen">
      <SEO title="Manage your listings | Comediq" description="Your mics and shows on Comediq." />
      <div className="px-4.5 pb-32 pt-14" style={{ padding: "56px 18px 120px" }}>
        <div className="flex items-start justify-between">
          <div>
            <div className="lf text-[32px]">Comediq</div>
            <div className="mt-1.5 text-sm" style={{ color: "#AEB9D6" }}>
              {hostName} · Host
            </div>
          </div>
          <Link to="/v3/profile" aria-label="Settings" className="p-1">
            <Settings className="h-6 w-6" aria-hidden="true" />
          </Link>
        </div>

        <div className="h2">Your profile</div>
        {profileCard}

        <div className="h2">Your listings</div>
        {isLoading && (
          <p className="text-[15px]" style={{ color: "#AEB9D6" }}>
            Loading your listings…
          </p>
        )}
        {!isLoading && listings.length === 0 && empty}
        {first && <HeroListingCard listing={first} />}
        {rest.map((listing) => (
          <ListingRow key={listing.mic.uniqueIdentifier} listing={listing} />
        ))}
        {listings.length > 0 && newListingButton}
      </div>
    </div>
  );
}
