import { useParams, Link, useNavigate, useSearchParams } from "react-router-dom";
import { useOpenMics } from "@/hooks/useOpenMics";
import { useMicRatings } from "@/hooks/useMicRatings";
import { parseVenueSlug, slugify } from "@/utils/slugify";
import { linkManager } from "@/utils/linkManager";
import SEO from "@/components/SEO";
import { generateEventSchema, generateLocalBusinessSchema, generateBreadcrumbSchema } from "@/utils/structuredData";
import { Button } from "@/components/ui/button";
import { Heart, ExternalLink, Navigation } from "lucide-react";
import { WentUpToggle } from "@/components/mic/WentUpToggle";
import ClaimMicButton from "@/components/host/ClaimMicButton";
import EditMicButton from "@/components/mic/EditMicButton";
import { useAuth } from "@/contexts/AuthContext";
import PageHeader from "@/components/PageHeader";

function getMapUrl(location: string, venueName: string) {
  const searchQuery = encodeURIComponent(`${venueName}, ${location}`);
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  return isIOS
    ? `https://maps.apple.com/?q=${searchQuery}`
    : `https://www.google.com/maps/search/?api=1&query=${searchQuery}`;
}

const MicDetailPage = () => {
  const { venueSlug } = useParams<{ venueSlug: string }>();
  const [searchParams] = useSearchParams();
  const idParam = searchParams.get('id');
  const navigate = useNavigate();
  const { data: mics, isLoading } = useOpenMics();
  const { user } = useAuth();

  // Prefer unique_identifier when provided (disambiguates mics that share venue+neighborhood)
  const mic = mics?.find(m => {
    if (idParam) return m.uniqueIdentifier === idParam;
    const micSlug = `${slugify(m.venueName)}-${slugify(m.neighborhood)}`;
    return micSlug === venueSlug;
  });

  const { userRating, ratingCounts, rateMic, removeRating, isRating } = useMicRatings(mic?.uniqueIdentifier || '');

  // Find similar mics (same borough, day, or cost)
  const similarMics = mics?.filter(m => {
    if (!mic || m.uniqueIdentifier === mic.uniqueIdentifier) return false;
    return m.borough === mic.borough || m.day === mic.day || m.cost === mic.cost;
  }).slice(0, 6);

  if (isLoading) {
    return <div className="container mx-auto px-4 py-16">Loading...</div>;
  }

  if (!mic) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Open Mic Not Found</h1>
        <p className="mb-4">The open mic you're looking for doesn't exist.</p>
        <Button onClick={() => navigate('/open-mics')}>Browse All Mics</Button>
      </div>
    );
  }

  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      generateEventSchema(mic),
      generateLocalBusinessSchema({
        name: mic.venueName,
        location: mic.location,
        borough: mic.borough,
        rating: ratingCounts ? ratingCounts.likes / (ratingCounts.likes + (ratingCounts.dislikes || 0)) * 5 : undefined,
        reviewCount: ratingCounts ? ratingCounts.likes + (ratingCounts.dislikes || 0) : undefined
      }),
      generateBreadcrumbSchema([
        { name: 'Home', url: 'https://comediq.us' },
        { name: 'Open Mics', url: 'https://comediq.us/open-mics' },
        { name: mic.borough, url: `https://comediq.us${linkManager.borough(mic.borough)}` },
        { name: mic.venueName, url: `https://comediq.us/mics/${venueSlug}` }
      ])
    ]
  };

  const titleTextClass = "text-[#07111f] dark:text-white";
  const mutedTextClass = "text-[#07111f]/60 dark:text-white/60";
  const descriptionTextClass = "text-[#07111f]/70 dark:text-white/80";
  const panelClass = "border border-[#07111f]/10 bg-white/50 text-[#07111f] shadow-[0_18px_60px_rgba(4,20,55,0.12)] backdrop-blur-xl dark:border-white/10 dark:bg-[#102a53]/60 dark:text-white dark:shadow-[0_18px_60px_rgba(4,20,55,0.24)]";
  const chipClass = "rounded-full border border-[#07111f]/10 bg-white/50 px-3 py-1.5 text-[11px] uppercase tracking-[0.15em] text-[#07111f] shadow-[0_10px_30px_rgba(2,10,30,0.10)] backdrop-blur-xl transition hover:bg-white/70 dark:border-white/20 dark:bg-white/10 dark:text-white dark:hover:bg-white/20";

  const Attr = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div className="rounded-xl border border-[#07111f]/10 bg-white/40 p-3 shadow-[0_10px_30px_rgba(2,10,30,0.08)] backdrop-blur-xl dark:border-white/10 dark:bg-white/10">
      <div className={`mb-1 text-[10px] uppercase tracking-[0.2em] ${mutedTextClass}`}>{label}</div>
      <div className={`break-words text-sm md:text-base ${titleTextClass}`}>{value}</div>
    </div>
  );

  return (
    <>
      <SEO
        title={`${mic.openMic} at ${mic.venueName} - NYC Comedy Open Mic | Comediq`}
        description={`Perform at ${mic.venueName} every ${mic.day} at ${mic.startTime}. ${mic.cost === 'Free' ? 'Free' : mic.cost} admission. ${mic.stageTime} stage time. ${mic.neighborhood}, ${mic.borough}. ${mic.signUpInstructions.substring(0, 100)}`}
        keywords={`${mic.venueName} open mic, ${mic.neighborhood} comedy, ${mic.borough} open mic, ${mic.day} comedy NYC, ${mic.cost === 'Free' ? 'free' : 'paid'} open mic`}
        url={`https://comediq.us/mics/${venueSlug}`}
        type="article"
        structuredData={structuredData}
      />

      <PageHeader title={mic.openMic} subtitle={`${mic.venueName} · ${mic.neighborhood}, ${mic.borough}`} />
      <div className="min-h-screen bg-transparent pb-6 pt-8 page-content-offset">
        <div className="max-w-[1600px] mx-auto px-5 md:px-10">
          <section className={`${panelClass} rounded-3xl p-5 md:p-8`}>
            {/* Top row: back + tiny meta */}
            <div className={`mb-6 flex items-center justify-between gap-4 text-[11px] uppercase tracking-[0.2em] ${mutedTextClass}`}>
              <button onClick={() => navigate(-1)} className="transition hover:text-[#1a5fb4] dark:hover:text-[#8ec5ff]">
                back
              </button>
              <span className="truncate text-right">{mic.neighborhood?.toLowerCase()} · {mic.borough?.toLowerCase()}</span>
            </div>

            {/* Display name */}
            <h1
              className={`break-words font-bold leading-[0.85] tracking-[-0.04em] ${titleTextClass}`}
              style={{
                fontSize: "clamp(2.25rem, 8vw, 6rem)",
              }}
            >
              {mic.openMic.toLowerCase()}
            </h1>

            {/* Tagline + actions */}
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 md:mt-6">
              <p className={`max-w-2xl text-sm ${mutedTextClass}`}>
                {mic.cost?.toLowerCase() === 'free' ? 'free' : mic.cost?.toLowerCase() || 'cost not specified'} · {mic.day?.toLowerCase()} · {mic.venueName?.toLowerCase()}{mic.stageTime ? ` · ${mic.stageTime} on stage` : ''}
              </p>
              <div className="flex flex-wrap gap-2">
                <WentUpToggle micId={mic.uniqueIdentifier} />
                {user && (
                  <button
                    onClick={() => {
                      if (userRating === 'like') removeRating(mic.uniqueIdentifier);
                      else rateMic({ micUniqueIdentifier: mic.uniqueIdentifier, rating: 'like' });
                    }}
                    disabled={isRating}
                    className={`${chipClass} inline-flex items-center gap-2 disabled:opacity-50 ${userRating === 'like' ? 'text-[#1a5fb4] dark:text-[#8ec5ff]' : ''}`}
                  >
                    <Heart className={`w-3 h-3 ${userRating === 'like' ? 'fill-current' : ''}`} />
                    {ratingCounts?.likes || 0}
                  </button>
                )}
                <a
                  href={getMapUrl(mic.location, mic.venueName)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-[#1a5fb4] px-3 py-1.5 text-[11px] uppercase tracking-[0.15em] text-white shadow-[0_10px_30px_rgba(26,95,180,0.24)] transition hover:bg-[#164f96] dark:bg-[#8ec5ff] dark:text-[#07111f] dark:hover:bg-[#bde3ff]"
                >
                  <Navigation className="w-3 h-3" />
                  directions
                </a>
              </div>
            </div>
          </section>

          {/* Attribute grid */}
          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Attr label="day" value={mic.day} />
            <Attr label="time" value={`${mic.startTime}${mic.latestEndTime ? '–' + mic.latestEndTime : ''}`} />
            <Attr label="cost" value={mic.cost || '—'} />
            <Attr label="stage time" value={mic.stageTime || '—'} />
            <Attr label="host" value={mic.hosts || mic.instagramHandle || '—'} />
            <Attr label="venue" value={mic.venueName} />
            <Attr label="neighborhood" value={mic.neighborhood} />
            <Attr label="borough" value={mic.borough} />
            <Attr
              label="address"
              value={
                <a href={getMapUrl(mic.location, mic.venueName)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[#1a5fb4] transition hover:text-[#164f96] dark:text-[#8ec5ff] dark:hover:text-[#bde3ff]">
                  {mic.location}<ExternalLink className="w-3 h-3" />
                </a>
              }
            />
          </div>

          {/* Sign up */}
          <div className={`${panelClass} mt-6 rounded-2xl p-5 md:p-6`}>
            <div className={`mb-2 text-[10px] uppercase tracking-[0.25em] ${mutedTextClass}`}>how to sign up</div>
            <p className={`whitespace-pre-wrap text-base leading-relaxed md:text-lg ${descriptionTextClass}`}>
              {mic.signUpInstructions || 'Contact venue for details.'}
            </p>
          </div>

          {/* Browse links */}
          <div className={`${panelClass} mt-6 flex flex-wrap gap-x-6 gap-y-2 rounded-2xl p-5 text-sm md:p-6`}>
            <Link to={linkManager.borough(mic.borough)} className="text-[#07111f]/70 transition hover:text-[#1a5fb4] dark:text-white/70 dark:hover:text-[#8ec5ff]">
              all {mic.borough?.toLowerCase()} mics
            </Link>
            <Link to={linkManager.neighborhood(mic.neighborhood)} className="text-[#07111f]/70 transition hover:text-[#1a5fb4] dark:text-white/70 dark:hover:text-[#8ec5ff]">
              more {mic.neighborhood?.toLowerCase()}
            </Link>
            <Link to={linkManager.micsByDay(mic.day)} className="text-[#07111f]/70 transition hover:text-[#1a5fb4] dark:text-white/70 dark:hover:text-[#8ec5ff]">
              all {mic.day?.toLowerCase()} mics
            </Link>
            {mic.cost === 'Free' && (
              <Link to={linkManager.freeMics()} className="text-[#07111f]/70 transition hover:text-[#1a5fb4] dark:text-white/70 dark:hover:text-[#8ec5ff]">
                all free mics
              </Link>
            )}
          </div>

          <div className="mt-6 space-y-3">
            <EditMicButton
              micUniqueIdentifier={mic.uniqueIdentifier}
              micName={mic.openMic}
            />
            <ClaimMicButton
              micUniqueIdentifier={mic.uniqueIdentifier}
              micName={mic.openMic}
              venueName={mic.venueName}
            />
          </div>

          {/* You might also like */}
          {similarMics && similarMics.length > 0 && (
            <section className={`${panelClass} mt-10 rounded-3xl p-5 md:p-6`}>
              <div className={`mb-4 text-[10px] uppercase tracking-[0.25em] ${mutedTextClass}`}>you might also like</div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4">
                {similarMics.map(similarMic => (
                  <Link
                    key={similarMic.uniqueIdentifier}
                    to={linkManager.micDetail(similarMic)}
                    className="group block rounded-xl border border-[#07111f]/10 bg-white/40 p-3 shadow-[0_10px_30px_rgba(2,10,30,0.08)] transition hover:bg-white/60 dark:border-white/10 dark:bg-white/10 dark:hover:bg-white/20"
                  >
                    <div className={`text-base font-medium transition group-hover:text-[#1a5fb4] dark:group-hover:text-[#8ec5ff] ${titleTextClass}`}>
                      {similarMic.openMic.toLowerCase()}
                    </div>
                    <div className={`mt-1 text-[11px] uppercase tracking-[0.15em] ${mutedTextClass}`}>
                      {similarMic.day} · {similarMic.cost} · {similarMic.neighborhood?.toLowerCase()}
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </>
  );
};

export default MicDetailPage;
