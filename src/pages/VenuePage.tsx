import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useOpenMics } from "@/hooks/useOpenMics";
import SEO from "@/components/SEO";
import PageHeader from "@/components/PageHeader";
import { DAYS, breadcrumbSchema, formatVerified, graph, micPath, placeSchema, slugify, summaryText, venueSlugOf, eventSchema, ORIGIN } from "@/lib/seoShared";

type Venue = { slug: string; name: string; address?: string; borough?: string; neighborhood?: string; city?: string; latitude?: number | null; longitude?: number | null };

const VenuePage = () => {
  const { slug = "" } = useParams<{ slug: string }>();
  const { data: mics = [], isLoading } = useOpenMics();
  const [venues, setVenues] = useState<Venue[] | null>(null);

  useEffect(() => {
    fetch("/venues.json").then((r) => (r.ok ? r.json() : [])).then(setVenues).catch(() => setVenues([]));
  }, []);

  const venueMics = mics
    .filter((m) => venueSlugOf(m) === slug)
    .sort((a, b) => DAYS.indexOf(a.day) - DAYS.indexOf(b.day));
  const first = venueMics[0];
  const venue: Venue | undefined =
    venues?.find((v) => v.slug === slug) ??
    (first ? { slug, name: first.venueName, address: first.location, borough: first.borough, neighborhood: first.neighborhood, city: first.city, latitude: first.latitude, longitude: first.longitude } : undefined);

  if (isLoading || venues === null) return <div className="container mx-auto px-4 py-16 page-content-offset">Loading...</div>;

  if (!venue || venueMics.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center page-content-offset">
        <SEO title="Venue Not Found | Comediq" description="This venue has no open mics listed on Comediq right now." noindex />
        <h1 className="text-2xl font-bold mb-4">Venue not found</h1>
        <Link to="/open-mics" className="text-primary underline">Browse all open mics</Link>
      </div>
    );
  }

  const area = [venue.neighborhood, venue.borough].filter(Boolean).join(", ");
  const summary = summaryText(venueMics, `at ${venue.name}`);
  const path = `/venue/${slug}`;
  const structuredData = graph(
    { ...placeSchema({ ...venue, url: `${ORIGIN}${path}` }), event: venueMics.map(eventSchema) },
    breadcrumbSchema([
      { name: "Home", path: "/" },
      { name: "Open Mics", path: "/open-mics" },
      ...(venue.borough ? [{ name: venue.borough, path: `/open-mics/${slugify(venue.borough)}` }] : []),
      { name: venue.name, path },
    ]),
  );
  const mapSrc = venue.latitude != null && venue.longitude != null
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${venue.longitude - 0.004},${venue.latitude - 0.0025},${venue.longitude + 0.004},${venue.latitude + 0.0025}&layer=mapnik&marker=${venue.latitude},${venue.longitude}`
    : null;

  return (
    <>
      <SEO
        title={`Comedy Open Mics at ${venue.name}${area ? ` (${venue.neighborhood || venue.borough})` : ""} | Comediq`}
        description={`${summary} ${venue.address ? `Address: ${venue.address}.` : ""}`.trim().slice(0, 300)}
        url={`${ORIGIN}${path}`}
        structuredData={structuredData}
      />
      <PageHeader title={venue.name} subtitle={area || "Comedy venue"} />
      <main className="max-w-4xl mx-auto px-4 pb-10 page-content-offset">
        <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground mt-4">Open mics at {venue.name}</h1>
        {venue.address && <p className="mt-2 text-sm text-muted-foreground">{venue.address}</p>}
        <p className="mt-4 text-base text-foreground/80">{summary}</p>

        {mapSrc && (
          <iframe title={`Map of ${venue.name}`} src={mapSrc} loading="lazy" className="mt-6 h-56 w-full rounded-xl border border-border" />
        )}

        <h2 className="mt-8 mb-3 text-xl font-semibold text-foreground">Mics at this venue</h2>
        <ul className="space-y-2">
          {venueMics.map((m) => (
            <li key={m.uniqueIdentifier} className="rounded-xl border border-border bg-card p-4">
              <Link to={micPath(m)} className="text-lg font-semibold text-foreground hover:text-primary">{m.openMic}</Link>
              <p className="text-sm text-muted-foreground">
                {[m.day, m.startTime, m.cost, m.stageTime && `${m.stageTime} on stage`].filter(Boolean).join(" · ")}
              </p>
              {formatVerified(m.lastVerifiedAt) && <p className="text-xs text-muted-foreground mt-1">Verified {formatVerified(m.lastVerifiedAt)}</p>}
            </li>
          ))}
        </ul>
      </main>
    </>
  );
};

export default VenuePage;
