import { useParams, Link, useNavigate } from "react-router-dom";
import { useOpenMics } from "@/hooks/useOpenMics";
import { useMicRatings } from "@/hooks/useMicRatings";
import { parseVenueSlug, slugify } from "@/utils/slugify";
import { linkManager } from "@/utils/linkManager";
import SEO from "@/components/SEO";
import { generateEventSchema, generateLocalBusinessSchema, generateBreadcrumbSchema } from "@/utils/structuredData";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, DollarSign, MapPin, UserRoundCheck, Heart, ExternalLink, Navigation, TicketCheck } from "lucide-react";
import { VerificationBadge } from "@/components/VerificationBadge";
import { OpenMic } from "@/types/openMic";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { MicSlotsGrid } from "@/components/mic/MicSlotsGrid";

function getMapUrl(location: string, venueName: string) {
  const searchQuery = encodeURIComponent(`${venueName}, ${location}`);
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  return isIOS
    ? `https://maps.apple.com/?q=${searchQuery}`
    : `https://www.google.com/maps/search/?api=1&query=${searchQuery}`;
}

const MicDetailPage = () => {
  const { venueSlug } = useParams<{ venueSlug: string }>();
  const navigate = useNavigate();
  const { data: mics, isLoading } = useOpenMics();
  const { user } = useAuth();

  const mic = mics?.find(m => {
    const micSlug = `${slugify(m.venueName)}-${slugify(m.neighborhood)}`;
    return micSlug === venueSlug;
  });

  const { userRating, ratingCounts, rateMic, removeRating, isRating } = useMicRatings(mic?.uniqueIdentifier || '');

  const similarMics = mic ? mics?.filter(m => {
    if (m.uniqueIdentifier === mic.uniqueIdentifier) return false;
    return m.borough === mic.borough || m.day === mic.day || m.cost === mic.cost || m.neighborhood === mic.neighborhood;
  }).map(m => {
    let score = 0;
    const sameDay = m.day === mic.day;
    const sameNeighborhood = m.neighborhood === mic.neighborhood;
    if (sameDay && sameNeighborhood) score += 3;
    else {
      if (sameNeighborhood) score += 2;
      if (sameDay) score += 2;
    }
    if (m.cost === mic.cost) score += 1;
    const parseTime = (t: string) => {
      const c = t.trim().toUpperCase();
      const m12 = c.match(/^(\d{1,2}):?(\d{2})?\s*(AM|PM)$/);
      if (m12) {
        let h = parseInt(m12[1]);
        const min = parseInt(m12[2] || '0');
        if (m12[3] === 'PM' && h !== 12) h += 12;
        if (m12[3] === 'AM' && h === 12) h = 0;
        return h * 60 + min;
      }
      return null;
    };
    const t1 = parseTime(mic.startTime);
    const t2 = parseTime(m.startTime);
    if (t1 !== null && t2 !== null && Math.abs(t1 - t2) <= 60) score += 1;
    return { mic: m, score };
  }).sort((a, b) => b.score - a.score).slice(0, 6).map(s => s.mic) : [];

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

      <div className="min-h-screen pb-20 pt-28">
        {/* Slots context header for slots-enabled mics */}
        {mic.slotsEnabled && (
          <div className="sticky top-[107px] z-[46] bg-background/95 backdrop-blur-sm border-b border-border px-4 py-3">
            <div className="container mx-auto flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <TicketCheck className="h-5 w-5 text-primary shrink-0" />
                <div className="min-w-0">
                  <h2 className="text-base font-bold leading-tight">Slots</h2>
                  <p className="text-xs text-muted-foreground">Sign up for open mic spots or open your own list</p>
                </div>
              </div>
              <Link to="/slots">
                <Button variant="outline" size="sm" className="text-xs shrink-0">
                  All Slots
                </Button>
              </Link>
            </div>
          </div>
        )}

        <div className="container mx-auto px-4 py-8">
          {/* Hero Section */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-2">
              <h1 className="text-4xl font-bold">{mic.openMic}</h1>
              <VerificationBadge 
                micUniqueIdentifier={mic.uniqueIdentifier}
                lastVerified={mic.lastVerified === "Unverified" ? undefined : mic.lastVerified}
              />
            </div>
            <p className="text-xl text-muted-foreground">at {mic.venueName}</p>
            
            {/* Quick Actions */}
            <div className="flex gap-4 mt-4">
              {user && (
                <Button
                  variant={userRating === 'like' ? 'default' : 'outline'}
                  onClick={() => {
                    if (userRating === 'like') removeRating(mic.uniqueIdentifier);
                    else rateMic({ micUniqueIdentifier: mic.uniqueIdentifier, rating: 'like' });
                  }}
                  disabled={isRating}
                >
                  <Heart className={`w-4 h-4 mr-2 ${userRating === 'like' ? 'fill-current' : ''}`} />
                  {userRating === 'like' ? 'Liked' : 'Like'} ({ratingCounts?.likes || 0})
                </Button>
              )}
              <Button variant="outline" asChild>
                <a href={getMapUrl(mic.location, mic.venueName)} target="_blank" rel="noopener noreferrer">
                  <Navigation className="w-4 h-4 mr-2" />
                  Get Directions
                </a>
              </Button>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="md:col-span-2 space-y-6">
              {/* Quick Info Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Info</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-2 py-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Day</p>
                      <p className="font-semibold">{mic.day}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Time</p>
                      <p className="font-semibold">{mic.startTime} - {mic.latestEndTime}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Cost</p>
                      <p className="font-semibold">{mic.cost}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Stage Time</p>
                      <p className="font-semibold">{mic.stageTime}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <UserRoundCheck className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Host</p>
                      <p className="font-semibold">{mic.hosts || mic.instagramHandle || 'N/A'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Comediq Slots! */}
              {mic.slotsEnabled && (
                <MicSlotsGrid
                  micId={mic.uniqueIdentifier}
                  micDay={mic.day}
                  startTime={mic.startTime}
                  slotDurationMinutes={mic.slotDurationMinutes}
                  pricePerSlot={mic.pricePerSlot}
                />
              )}

              {/* Sign-Up Instructions (only for non-slots mics) */}
              {!mic.slotsEnabled && (
                <Card>
                  <CardHeader>
                    <CardTitle>How to Sign Up</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="whitespace-pre-wrap">{mic.signUpInstructions || 'Contact venue for details'}</p>
                  </CardContent>
                </Card>
              )}

              {/* Venue Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Venue Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-5 h-5 text-muted-foreground mt-1" />
                    <div>
                      <p className="font-semibold">{mic.venueName}</p>
                      <a 
                        href={getMapUrl(mic.location, mic.venueName)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline flex items-center gap-1"
                      >
                        {mic.location}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                      <p className="text-sm text-muted-foreground mt-1">
                        {mic.neighborhood}, {mic.borough}
                      </p>
                    </div>
                  </div>
                  
                  {/* Embedded Map */}
                  <div className="w-full h-64 bg-muted rounded-lg overflow-hidden">
                    <iframe
                      width="100%"
                      height="100%"
                      frameBorder="0"
                      style={{ border: 0 }}
                      src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${encodeURIComponent(mic.venueName + ', ' + mic.location)}`}
                      allowFullScreen
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Browse Similar</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Link to={linkManager.borough(mic.borough)} className="block text-primary hover:underline">
                    All mics in {mic.borough} →
                  </Link>
                  <Link to={linkManager.neighborhood(mic.neighborhood)} className="block text-primary hover:underline">
                    More {mic.neighborhood} mics →
                  </Link>
                  <Link to={linkManager.micsByDay(mic.day)} className="block text-primary hover:underline">
                    All {mic.day} mics →
                  </Link>
                  {mic.cost === 'Free' && (
                    <Link to={linkManager.freeMics()} className="block text-primary hover:underline">
                      All free mics →
                    </Link>
                  )}
                </CardContent>
              </Card>

              {similarMics && similarMics.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">You Might Also Like</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {similarMics.map(similarMic => (
                      <Link
                        key={similarMic.uniqueIdentifier}
                        to={linkManager.micDetail(similarMic)}
                        className="block p-3 border rounded-lg hover:bg-muted transition"
                      >
                        <p className="font-semibold text-sm">{similarMic.openMic}</p>
                        <p className="text-xs text-muted-foreground">{similarMic.venueName}</p>
                        <p className="text-xs text-muted-foreground">{similarMic.day} • {similarMic.cost}</p>
                      </Link>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default MicDetailPage;
