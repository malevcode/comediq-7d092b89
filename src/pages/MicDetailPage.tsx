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

      <div className="min-h-screen bg-[#0a0a0a] pt-20 pb-16" style={{ color: cream }}>
        <div className="max-w-[1400px] mx-auto px-5 md:px-10">
          {/* Top row: back + tiny meta */}
          <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.2em] text-white/50 mb-4">
            <button onClick={() => navigate(-1)} className="hover:text-white transition">
              ← back
            </button>
            <span>{mic.neighborhood?.toLowerCase()} · {mic.borough?.toLowerCase()}</span>
          </div>

          {/* Display name */}
          <h1
            className="font-bold leading-[0.85] tracking-[-0.04em] break-words"
            style={{
              color: cream,
              fontSize: "clamp(2.25rem, 8vw, 6rem)",
            }}
          >
            {mic.openMic.toLowerCase()}
          </h1>

          {/* Tagline + actions */}
          <div className="mt-3 md:mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-white/50 text-sm max-w-2xl">
              {mic.cost?.toLowerCase() === 'free' ? 'free' : mic.cost?.toLowerCase()} · {mic.day?.toLowerCase()} · {mic.venueName?.toLowerCase()}{mic.stageTime ? ` · ${mic.stageTime} on stage` : ''}
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
                  className="inline-flex items-center gap-2 border border-white/20 hover:border-white/60 rounded-full px-3 py-1.5 text-[11px] uppercase tracking-[0.15em] transition"
                  style={{ color: cream }}
                >
                  <Heart className={`w-3 h-3 ${userRating === 'like' ? 'fill-current' : ''}`} />
                  {ratingCounts?.likes || 0}
                </button>
              )}
              <a
                href={getMapUrl(mic.location, mic.venueName)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] uppercase tracking-[0.15em] transition"
                style={{ backgroundColor: cream, color: "#0a0a0a" }}
              >
                <Navigation className="w-3 h-3" />
                directions
              </a>
            </div>
          </div>

          {/* Attribute grid — 3 per row */}
          <div className="mt-8 grid grid-cols-3 gap-x-6 gap-y-5 border-t border-white/10 pt-6">
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
                <a href={getMapUrl(mic.location, mic.venueName)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-white transition">
                  {mic.location}<ExternalLink className="w-3 h-3" />
                </a>
              }
            />
          </div>

          {/* Sign up */}
          <div className="mt-8 border-t border-white/10 pt-6">
            <div className="text-[10px] uppercase tracking-[0.25em] text-white/40 mb-2">how to sign up</div>
            <p className="text-base md:text-lg leading-relaxed whitespace-pre-wrap" style={{ color: cream }}>
              {mic.signUpInstructions || 'Contact venue for details.'}
            </p>
          </div>

          {/* Browse links */}
          <div className="mt-8 border-t border-white/10 pt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/60">
            <Link to={linkManager.borough(mic.borough)} className="hover:text-white transition">
              all {mic.borough?.toLowerCase()} mics →
            </Link>
            <Link to={linkManager.neighborhood(mic.neighborhood)} className="hover:text-white transition">
              more {mic.neighborhood?.toLowerCase()} →
            </Link>
            <Link to={linkManager.micsByDay(mic.day)} className="hover:text-white transition">
              all {mic.day?.toLowerCase()} mics →
            </Link>
            {mic.cost === 'Free' && (
              <Link to={linkManager.freeMics()} className="hover:text-white transition">
                all free mics →
              </Link>
            )}
          </div>

          <div className="mt-6">
            <ClaimMicButton
              micUniqueIdentifier={mic.uniqueIdentifier}
              micName={mic.openMic}
              venueName={mic.venueName}
            />
          </div>

          {/* You might also like */}
          {similarMics && similarMics.length > 0 && (
            <section className="mt-16 border-t border-white/10 pt-6">
              <div className="text-[10px] uppercase tracking-[0.25em] text-white/40 mb-4">you might also like</div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4">
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
