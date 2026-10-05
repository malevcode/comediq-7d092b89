import { useParams, Link, useNavigate, useSearchParams, Navigate } from "react-router-dom";
import { micSlug, micPath, venuePath, eventSchema, breadcrumbSchema, graph, slugify as seoSlugify, formatVerified } from "@/lib/seoShared";
import { useOpenMics } from "@/hooks/useOpenMics";
import { useMicRatings } from "@/hooks/useMicRatings";
import { parseVenueSlug, slugify } from "@/utils/slugify";
import { linkManager } from "@/utils/linkManager";
import SEO from "@/components/SEO";
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
  const { venueSlug, slug } = useParams<{ venueSlug?: string; slug?: string }>();
  const [searchParams] = useSearchParams();
  const idParam = searchParams.get('id');
  const navigate = useNavigate();
  const { data: mics, isLoading } = useOpenMics();
  const { user } = useAuth();

  // Prefer unique_identifier when provided (disambiguates mics that share venue+neighborhood)
  const mic = mics?.find(m => {
    if (idParam) return m.uniqueIdentifier === idParam;
    if (slug) return micSlug(m) === slug;
    return `${slugify(m.venueName)}-${slugify(m.neighborhood)}` === venueSlug;
  }) ?? (slug ? mics?.find(m => seoSlugify(m.openMic) === slug) : undefined);

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

  // Legacy /mics/:venueSlug and ?id= links move to the canonical /mic/:slug page.
  if (!slug || idParam || micSlug(mic) !== slug) {
    return <Navigate to={micPath(mic)} replace />;
  }

  const structuredData = graph(
    eventSchema(mic),
    breadcrumbSchema([
      { name: 'Home', path: '/' },
      { name: 'Open Mics', path: '/open-mics' },
      ...(mic.borough ? [{ name: mic.borough, path: `/open-mics/${seoSlugify(mic.borough)}` }] : []),
      { name: mic.openMic, path: micPath(mic) },
    ]),
  );

  const titleTextClass = "text-[#07111f] dark:text-white";
  const mutedTextClass = "text-[#07111f]/60 dark:text-white/60";
  const descriptionTextClass = "text-[#07111f]/70 dark:text-white/80";
  const panelClass = "border border-[#07111f]/10 bg-white/25 text-[#07111f] shadow-[0_30px_100px_rgba(4,20,55,0.18),0_10px_32px_rgba(4,20,55,0.10)] backdrop-blur-2xl dark:border-white/10 dark:bg-[#102a53]/20 dark:text-white dark:shadow-[0_30px_100px_rgba(2,10,30,0.44),0_10px_32px_rgba(2,10,30,0.28)]";
  const chipClass = "rounded-full border border-[#07111f]/10 bg-white/25 px-3 py-1.5 text-[11px] uppercase tracking-[0.15em] text-[#07111f] shadow-[0_18px_60px_rgba(2,10,30,0.14),0_6px_20px_rgba(2,10,30,0.08)] backdrop-blur-2xl transition hover:bg-white/35 dark:border-white/20 dark:bg-[#102a53]/20 dark:text-white dark:hover:bg-white/20 dark:shadow-[0_20px_70px_rgba(2,10,30,0.34)]";

  const Attr = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div className="rounded-xl border border-[#07111f]/10 bg-white/25 p-3 shadow-[0_20px_70px_rgba(2,10,30,0.14),0_8px_24px_rgba(2,10,30,0.08)] backdrop-blur-2xl dark:border-white/10 dark:bg-[#102a53]/20 dark:shadow-[0_24px_80px_rgba(2,10,30,0.34)]">
      <div className={`mb-1 text-[10px] uppercase tracking-[0.2em] ${mutedTextClass}`}>{label}</div>
      <div className={`break-words text-sm md:text-base ${titleTextClass}`}>{value}</div>
    </div>
  );

  return (
    <>
      <SEO
        title={`${mic.openMic} at ${mic.venueName} | Comediq`.slice(0, 60)}
        description={`Perform at ${mic.venueName} every ${mic.day} at ${mic.startTime}. ${mic.cost === 'Free' ? 'Free' : mic.cost} admission. ${mic.stageTime} stage time. ${mic.neighborhood}, ${mic.borough}. ${mic.signUpInstructions.substring(0, 100)}`}
        keywords={`${mic.venueName} open mic, ${mic.neighborhood} comedy, ${mic.borough} open mic, ${mic.day} comedy NYC, ${mic.cost === 'Free' ? 'free' : 'paid'} open mic`}
        url={`https://comediq.us${micPath(mic)}`}
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
                {formatVerified(mic.lastVerifiedAt) ? ` · verified ${formatVerified(mic.lastVerifiedAt)!.toLowerCase()}` : ''}
              </p>
              <div className="flex flex-wrap gap-2">
                <WentUpToggle mic={mic} />
                <button
                  onClick={() => {
                    if (!user) {
                      // Send them to sign in and bring them straight back here.
                      navigate(`/auth?next=${encodeURIComponent(`${window.location.pathname}${window.location.search}`)}`);
                      return;
                    }
                    if (userRating === 'like') removeRating(mic.uniqueIdentifier);
                    else rateMic({ micUniqueIdentifier: mic.uniqueIdentifier, rating: 'like' });
                  }}
                  disabled={isRating}
                  title={user ? 'Upvote this mic' : 'Sign in to upvote'}
                  className={`${chipClass} inline-flex items-center gap-2 disabled:opacity-50 ${userRating === 'like' ? 'text-[#1a5fb4] dark:text-[#8ec5ff]' : ''}`}
                >
                  <Heart className={`w-3 h-3 ${userRating === 'like' ? 'fill-current' : ''}`} />
                  {ratingCounts?.likes || 0}
                </button>
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
            <Attr label="cost" value={mic.cost || 'Not listed'} />
            <Attr label="stage time" value={mic.stageTime || 'Not listed'} />
            <Attr label="host" value={mic.hosts || mic.instagramHandle || 'Not listed'} />
            <Attr label="venue" value={<Link to={venuePath(mic)} className="underline decoration-dotted underline-offset-4 hover:text-[#1a5fb4] dark:hover:text-[#8ec5ff]">{mic.venueName}</Link>} />
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
            <h2 className={`mb-2 text-[10px] font-normal uppercase tracking-[0.25em] ${mutedTextClass}`}>how to sign up</h2>
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
              <h2 className={`mb-4 text-[10px] font-normal uppercase tracking-[0.25em] ${mutedTextClass}`}>you might also like</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4">
                {similarMics.map(similarMic => (
                  <Link
                    key={similarMic.uniqueIdentifier}
                    to={linkManager.micDetail(similarMic)}
                    className="group block rounded-xl border border-[#07111f]/10 bg-white/25 p-3 shadow-[0_20px_70px_rgba(2,10,30,0.14),0_8px_24px_rgba(2,10,30,0.08)] backdrop-blur-2xl transition hover:bg-white/35 dark:border-white/10 dark:bg-[#102a53]/20 dark:hover:bg-white/20 dark:shadow-[0_24px_80px_rgba(2,10,30,0.34)]"
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
