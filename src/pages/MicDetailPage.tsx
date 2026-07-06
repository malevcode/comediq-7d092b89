import { useParams, Link, useNavigate, useSearchParams } from "react-router-dom";
import { useOpenMics } from "@/hooks/useOpenMics";
import { useMicRatings } from "@/hooks/useMicRatings";
import { parseVenueSlug, slugify } from "@/utils/slugify";
import { linkManager } from "@/utils/linkManager";
import SEO from "@/components/SEO";
import { generateEventSchema, generateLocalBusinessSchema, generateBreadcrumbSchema } from "@/utils/structuredData";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, DollarSign, MapPin, UserRoundCheck, Heart, ArrowLeft, ExternalLink, Navigation } from "lucide-react";
import { WentUpToggle } from "@/components/mic/WentUpToggle";
import { VerificationBadge } from "@/components/VerificationBadge";
import ClaimMicButton from "@/components/host/ClaimMicButton";
import { OpenMic } from "@/types/openMic";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";

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

  const cream = "#f5f0e6";

  const Attr = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div className="border-t border-white/10 pt-3">
      <div className="text-[10px] uppercase tracking-[0.2em] text-white/40 mb-1">{label}</div>
      <div className="text-sm md:text-base" style={{ color: cream }}>{value}</div>
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

      <div className="min-h-screen bg-[#0a0a0a] pt-24 pb-24" style={{ color: cream }}>
        <div className="max-w-[1600px] mx-auto px-5 md:px-10">
          {/* Top row: back + tiny meta */}
          <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.2em] text-white/50 mb-10">
            <button onClick={() => navigate(-1)} className="hover:text-white transition">
              ← back
            </button>
            <span className="hidden sm:block">{mic.neighborhood} · {mic.borough}</span>
            <VerificationBadge
              micUniqueIdentifier={mic.uniqueIdentifier}
              lastVerified={mic.lastVerified === "Unverified" ? undefined : mic.lastVerified}
            />
          </div>

          {/* Massive display name */}
          <h1
            className="font-bold leading-[0.85] tracking-[-0.04em] break-words"
            style={{
              color: cream,
              fontSize: "clamp(3.5rem, 14vw, 12rem)",
            }}
          >
            {mic.openMic.toLowerCase()}
          </h1>

          {/* Tagline row */}
          <div className="mt-6 md:mt-10 grid md:grid-cols-12 gap-6 items-end">
            <p
              className="md:col-span-7 text-white/50 text-sm md:text-base max-w-xl"
            >
              a {mic.cost?.toLowerCase() === 'free' ? 'free' : 'paid'} {mic.day?.toLowerCase()} open mic at {mic.venueName?.toLowerCase()} in {mic.neighborhood?.toLowerCase()}. {mic.stageTime ? `${mic.stageTime} of stage time.` : ''}
            </p>
            <div className="md:col-span-5 flex flex-wrap gap-2 md:justify-end">
              <WentUpToggle micId={mic.uniqueIdentifier} />
              {user && (
                <button
                  onClick={() => {
                    if (userRating === 'like') removeRating(mic.uniqueIdentifier);
                    else rateMic({ micUniqueIdentifier: mic.uniqueIdentifier, rating: 'like' });
                  }}
                  disabled={isRating}
                  className="inline-flex items-center gap-2 border border-white/20 hover:border-white/60 rounded-full px-4 py-2 text-xs uppercase tracking-[0.15em] transition"
                  style={{ color: cream }}
                >
                  <Heart className={`w-3.5 h-3.5 ${userRating === 'like' ? 'fill-current' : ''}`} />
                  {userRating === 'like' ? 'liked' : 'like'} · {ratingCounts?.likes || 0}
                </button>
              )}
              <a
                href={getMapUrl(mic.location, mic.venueName)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs uppercase tracking-[0.15em] transition"
                style={{ backgroundColor: cream, color: "#0a0a0a" }}
              >
                <Navigation className="w-3.5 h-3.5" />
                directions
              </a>
            </div>
          </div>

          {/* Attribute grid */}
          <div className="mt-20 grid grid-cols-2 md:grid-cols-5 gap-x-8 gap-y-6">
            <Attr label="day" value={mic.day} />
            <Attr label="time" value={`${mic.startTime}${mic.latestEndTime ? ' – ' + mic.latestEndTime : ''}`} />
            <Attr label="cost" value={mic.cost || '—'} />
            <Attr label="stage time" value={mic.stageTime || '—'} />
            <Attr label="host" value={mic.hosts || mic.instagramHandle || '—'} />
          </div>

          {/* Body sections */}
          <div className="mt-24 grid md:grid-cols-12 gap-12">
            <div className="md:col-span-7 space-y-16">
              <section>
                <div className="text-[10px] uppercase tracking-[0.25em] text-white/40 mb-4">how to sign up</div>
                <p className="text-lg md:text-xl leading-relaxed whitespace-pre-wrap" style={{ color: cream }}>
                  {mic.signUpInstructions || 'Contact venue for details.'}
                </p>
              </section>

              <section>
                <div className="text-[10px] uppercase tracking-[0.25em] text-white/40 mb-4">venue</div>
                <div className="text-2xl md:text-3xl font-semibold tracking-tight" style={{ color: cream }}>
                  {mic.venueName}
                </div>
                <a
                  href={getMapUrl(mic.location, mic.venueName)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1 text-sm text-white/60 hover:text-white transition"
                >
                  {mic.location}
                  <ExternalLink className="w-3 h-3" />
                </a>
                <div className="mt-6 w-full h-64 rounded-md overflow-hidden border border-white/10">
                  <iframe
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    style={{ border: 0, filter: "grayscale(1) invert(0.92) contrast(0.85)" }}
                    src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${encodeURIComponent(mic.venueName + ', ' + mic.location)}`}
                    allowFullScreen
                  />
                </div>
              </section>
            </div>

            <aside className="md:col-span-5 md:pl-8 md:border-l md:border-white/10 space-y-12">
              <ClaimMicButton
                micUniqueIdentifier={mic.uniqueIdentifier}
                micName={mic.openMic}
                venueName={mic.venueName}
              />

              <section>
                <div className="text-[10px] uppercase tracking-[0.25em] text-white/40 mb-4">browse</div>
                <div className="space-y-3 text-lg">
                  <Link to={linkManager.borough(mic.borough)} className="block hover:text-white transition text-white/70">
                    all mics in {mic.borough?.toLowerCase()} →
                  </Link>
                  <Link to={linkManager.neighborhood(mic.neighborhood)} className="block hover:text-white transition text-white/70">
                    more {mic.neighborhood?.toLowerCase()} mics →
                  </Link>
                  <Link to={linkManager.micsByDay(mic.day)} className="block hover:text-white transition text-white/70">
                    all {mic.day?.toLowerCase()} mics →
                  </Link>
                  {mic.cost === 'Free' && (
                    <Link to={linkManager.freeMics()} className="block hover:text-white transition text-white/70">
                      all free mics →
                    </Link>
                  )}
                </div>
              </section>

              {similarMics && similarMics.length > 0 && (
                <section>
                  <div className="text-[10px] uppercase tracking-[0.25em] text-white/40 mb-4">you might also like</div>
                  <div className="space-y-4">
                    {similarMics.map(similarMic => (
                      <Link
                        key={similarMic.uniqueIdentifier}
                        to={linkManager.micDetail(similarMic)}
                        className="block group border-t border-white/10 pt-3"
                      >
                        <div className="text-base font-medium group-hover:text-white transition" style={{ color: cream }}>
                          {similarMic.openMic.toLowerCase()}
                        </div>
                        <div className="text-[11px] uppercase tracking-[0.15em] text-white/40 mt-1">
                          {similarMic.day} · {similarMic.cost}
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              )}
            </aside>
          </div>
        </div>
      </div>
    </>
  );
};

export default MicDetailPage;
