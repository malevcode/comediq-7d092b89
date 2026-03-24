import { useParams, Link, useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();
  const { data: mics, isLoading } = useOpenMics();
  const { user } = useAuth();

  // Find mic by matching slug
  const mic = mics?.find(m => {
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
        <div className="container mx-auto px-4 py-8">
          {/* Back Button */}
          <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

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
            <div className="flex gap-4 mt-4 flex-wrap">
              <WentUpToggle micId={mic.uniqueIdentifier} />
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
                <CardContent className="grid grid-cols-2 gap-4">
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

              {/* Sign-Up Instructions */}
              <Card>
                <CardHeader>
                  <CardTitle>How to Sign Up</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap">{mic.signUpInstructions || 'Contact venue for details'}</p>
                </CardContent>
              </Card>

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
                        className="text-blue-600 hover:underline flex items-center gap-1"
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
              {/* Browse Links */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Browse Similar</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Link 
                    to={linkManager.borough(mic.borough)}
                    className="block text-blue-600 hover:underline"
                  >
                    All mics in {mic.borough} →
                  </Link>
                  <Link 
                    to={linkManager.neighborhood(mic.neighborhood)}
                    className="block text-blue-600 hover:underline"
                  >
                    More {mic.neighborhood} mics →
                  </Link>
                  <Link 
                    to={linkManager.micsByDay(mic.day)}
                    className="block text-blue-600 hover:underline"
                  >
                    All {mic.day} mics →
                  </Link>
                  {mic.cost === 'Free' && (
                    <Link 
                      to={linkManager.freeMics()}
                      className="block text-blue-600 hover:underline"
                    >
                      All free mics →
                    </Link>
                  )}
                </CardContent>
              </Card>

              {/* Similar Mics */}
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
