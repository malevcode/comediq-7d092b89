import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useWrapped } from '@/hooks/useWrapped';
import { useComedianProfile } from '@/hooks/useComedianProfile';
import SEO from '@/components/SEO';
import WrappedSlide from '@/components/wrapped/WrappedSlide';
import WrappedSummaryCard from '@/components/wrapped/WrappedSummaryCard';
import AnimatedCounter from '@/components/wrapped/AnimatedCounter';
import ProgressDots from '@/components/wrapped/ProgressDots';
import { Button } from '@/components/ui/button';
import { 
  Mic, 
  Clock, 
  Building2, 
  MapPin, 
  Calendar, 
  Sparkles, 
  ChevronRight, 
  ChevronLeft,
  Share2,
  Home,
  LogIn
} from 'lucide-react';
import { cn } from '@/lib/utils';

const YEAR = 2025;

const gradients = [
  'from-orange-500 via-pink-500 to-purple-600',
  'from-cyan-500 via-blue-500 to-purple-600',
  'from-pink-500 via-rose-500 to-orange-500',
  'from-emerald-500 via-teal-500 to-cyan-500',
  'from-violet-500 via-purple-500 to-pink-500',
  'from-amber-500 via-orange-500 to-red-500',
  'from-indigo-500 via-purple-500 to-pink-500',
];

const Wrapped = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const { data: stats, isLoading: statsLoading } = useWrapped(user?.id, YEAR);
  const { data: profile } = useComedianProfile(user?.id);

  const totalSlides = 7;

  const nextSlide = () => {
    if (isAnimating || currentSlide >= totalSlides - 1) return;
    setIsAnimating(true);
    setCurrentSlide(prev => prev + 1);
    setTimeout(() => setIsAnimating(false), 500);
  };

  const prevSlide = () => {
    if (isAnimating || currentSlide <= 0) return;
    setIsAnimating(true);
    setCurrentSlide(prev => prev - 1);
    setTimeout(() => setIsAnimating(false), 500);
  };

  const goToSlide = (index: number) => {
    if (isAnimating || index === currentSlide) return;
    setIsAnimating(true);
    setCurrentSlide(index);
    setTimeout(() => setIsAnimating(false), 500);
  };

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        nextSlide();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prevSlide();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentSlide, isAnimating]);

  // Not logged in
  if (!authLoading && !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-500 via-pink-500 to-cyan-500 flex flex-col items-center justify-center p-6 text-white">
        <SEO title="Comediq Wrapped 2025" description="See your comedy year in review" noindex />
        <Sparkles className="h-16 w-16 mb-6 animate-pulse" />
        <h1 className="text-4xl font-black mb-4 text-center">COMEDIQ WRAPPED</h1>
        <p className="text-xl text-white/90 mb-8 text-center">Sign in to see your {YEAR} comedy journey</p>
        <Button 
          onClick={() => navigate('/auth')} 
          size="lg" 
          className="bg-white text-orange-600 hover:bg-white/90 font-bold"
        >
          <LogIn className="mr-2 h-5 w-5" />
          Sign In
        </Button>
      </div>
    );
  }

  // Loading
  if (authLoading || statsLoading || !stats) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-500 via-pink-500 to-cyan-500 flex flex-col items-center justify-center p-6 text-white">
        <SEO title="Comediq Wrapped 2025" description="See your comedy year in review" noindex />
        <Sparkles className="h-16 w-16 mb-6 animate-pulse" />
        <h1 className="text-2xl font-bold">Loading your year...</h1>
      </div>
    );
  }

  // No data
  if (stats.totalMics === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-500 via-pink-500 to-cyan-500 flex flex-col items-center justify-center p-6 text-white">
        <SEO title="Comediq Wrapped 2025" description="See your comedy year in review" noindex />
        <Mic className="h-16 w-16 mb-6 opacity-50" />
        <h1 className="text-3xl font-black mb-4 text-center">NO MICS YET?</h1>
        <p className="text-lg text-white/90 mb-8 text-center max-w-md">
          You haven't tracked any open mics in {YEAR} yet. Start tracking your mics to get your wrapped!
        </p>
        <Button 
          onClick={() => navigate('/open-mics')} 
          size="lg" 
          className="bg-white text-orange-600 hover:bg-white/90 font-bold"
        >
          Find Open Mics
        </Button>
      </div>
    );
  }

  const hours = Math.floor(stats.estimatedStageTime / 60);
  const minutes = stats.estimatedStageTime % 60;

  const renderSlide = () => {
    switch (currentSlide) {
      // Welcome slide
      case 0:
        return (
          <WrappedSlide gradient={gradients[0]}>
            <Sparkles className="h-20 w-20 text-white mb-8 animate-pulse" />
            <h1 className="text-5xl md:text-7xl font-black text-white text-center mb-4">
              YOUR {YEAR}
            </h1>
            <p className="text-2xl md:text-3xl text-white/90 font-medium text-center mb-8">
              Comedy Journey
            </p>
            <p className="text-white/70 text-center">Tap to continue →</p>
          </WrappedSlide>
        );

      // Total mics
      case 1:
        return (
          <WrappedSlide gradient={gradients[1]}>
            <Mic className="h-20 w-20 text-white mb-8" />
            <p className="text-xl text-white/80 mb-4">This year you hit</p>
            <div className="text-8xl md:text-9xl font-black text-white mb-4">
              <AnimatedCounter value={stats.totalMics} />
            </div>
            <p className="text-3xl text-white font-bold">
              OPEN {stats.totalMics === 1 ? 'MIC' : 'MICS'}
            </p>
            {stats.totalMics >= 50 && (
              <p className="mt-6 text-xl text-white/80">You're a grinder! 🔥</p>
            )}
            {stats.totalMics >= 100 && (
              <p className="mt-2 text-lg text-white/70">Top 1% of comedians!</p>
            )}
          </WrappedSlide>
        );

      // Stage time
      case 2:
        return (
          <WrappedSlide gradient={gradients[2]}>
            <Clock className="h-20 w-20 text-white mb-8" />
            <p className="text-xl text-white/80 mb-4">You spent</p>
            <div className="flex items-baseline gap-4 mb-4">
              {hours > 0 && (
                <>
                  <span className="text-8xl md:text-9xl font-black text-white">
                    <AnimatedCounter value={hours} />
                  </span>
                  <span className="text-3xl text-white/80">hours</span>
                </>
              )}
              <span className="text-8xl md:text-9xl font-black text-white">
                <AnimatedCounter value={minutes} />
              </span>
              <span className="text-3xl text-white/80">min</span>
            </div>
            <p className="text-3xl text-white font-bold">ON STAGE</p>
            <p className="mt-6 text-lg text-white/70">
              That's {stats.totalMics * 5} jokes told! (assuming 1 per minute)
            </p>
          </WrappedSlide>
        );

      // Top venue
      case 3:
        return (
          <WrappedSlide gradient={gradients[3]}>
            <Building2 className="h-20 w-20 text-white mb-8" />
            <p className="text-xl text-white/80 mb-4">Your favorite spot was</p>
            <h2 className="text-4xl md:text-5xl font-black text-white text-center mb-4 px-4">
              {stats.topVenue?.name || 'N/A'}
            </h2>
            {stats.topVenue && (
              <p className="text-2xl text-white/90">
                You went there <span className="font-bold">{stats.topVenue.count}</span> times!
              </p>
            )}
            <p className="mt-8 text-lg text-white/70">
              Across {stats.uniqueVenues} unique venues
            </p>
          </WrappedSlide>
        );

      // Favorite day
      case 4:
        return (
          <WrappedSlide gradient={gradients[4]}>
            <Calendar className="h-20 w-20 text-white mb-8" />
            <p className="text-xl text-white/80 mb-4">Your mic day is</p>
            <h2 className="text-6xl md:text-7xl font-black text-white text-center mb-4">
              {stats.favoriteDay?.toUpperCase() || 'EVERY DAY'}
            </h2>
            <div className="flex flex-wrap justify-center gap-2 mt-8 max-w-sm">
              {stats.daysBreakdown.map(({ day, count }) => (
                <div
                  key={day}
                  className={cn(
                    'px-3 py-1 rounded-full text-sm font-medium',
                    day === stats.favoriteDay
                      ? 'bg-white text-purple-600'
                      : 'bg-white/20 text-white'
                  )}
                >
                  {day.slice(0, 3)}: {count}
                </div>
              ))}
            </div>
          </WrappedSlide>
        );

      // Boroughs explored
      case 5:
        return (
          <WrappedSlide gradient={gradients[5]}>
            <MapPin className="h-20 w-20 text-white mb-8" />
            <p className="text-xl text-white/80 mb-4">You conquered</p>
            <div className="text-8xl md:text-9xl font-black text-white mb-4">
              <AnimatedCounter value={stats.uniqueBoroughs.length} />
            </div>
            <p className="text-3xl text-white font-bold mb-8">
              {stats.uniqueBoroughs.length === 1 ? 'BOROUGH' : 'BOROUGHS'}
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {stats.uniqueBoroughs.map(borough => (
                <span
                  key={borough}
                  className="bg-white/20 px-4 py-2 rounded-full text-white font-medium"
                >
                  {borough}
                </span>
              ))}
            </div>
            <p className="mt-6 text-lg text-white/70">
              {stats.uniqueNeighborhoods.length} neighborhoods explored
            </p>
          </WrappedSlide>
        );

      // Summary card
      case 6:
        return (
          <WrappedSlide gradient={gradients[6]} className="py-12">
            <h2 className="text-3xl font-black text-white mb-8 text-center">
              YOUR {YEAR} WRAPPED
            </h2>
            <WrappedSummaryCard 
              stats={stats} 
              stageName={profile?.stage_name || profile?.username}
              year={YEAR}
            />
            <div className="flex flex-col sm:flex-row gap-4 mt-8">
              <Button
                onClick={() => {
                  // TODO: Implement share functionality
                  if (navigator.share) {
                    navigator.share({
                      title: 'My Comediq Wrapped 2025',
                      text: `I hit ${stats.totalMics} open mics in ${YEAR}! Check out your comedy wrapped on Comediq.`,
                      url: window.location.href,
                    });
                  }
                }}
                size="lg"
                className="bg-white text-purple-600 hover:bg-white/90 font-bold"
              >
                <Share2 className="mr-2 h-5 w-5" />
                Share
              </Button>
              <Button
                onClick={() => navigate('/profile')}
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white/20"
              >
                <Home className="mr-2 h-5 w-5" />
                Back to Profile
              </Button>
            </div>
          </WrappedSlide>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <SEO 
        title={`Your ${YEAR} Comedy Wrapped | Comediq`}
        description="See your comedy year in review - total mics, stage time, favorite venues, and more!"
        noindex 
      />
      <div 
        className="min-h-screen bg-black relative overflow-hidden"
        onClick={(e) => {
          // Tap to advance (but not on buttons)
          if ((e.target as HTMLElement).tagName !== 'BUTTON') {
            nextSlide();
          }
        }}
      >
        {/* Slide content */}
        <div className="relative z-10">
          {renderSlide()}
        </div>

        {/* Navigation */}
        <div className="fixed bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/50 to-transparent pb-6 pt-12">
          <ProgressDots 
            total={totalSlides} 
            current={currentSlide} 
            onDotClick={goToSlide}
          />
          
          <div className="flex justify-center gap-4 mt-4">
            <Button
              onClick={(e) => { e.stopPropagation(); prevSlide(); }}
              disabled={currentSlide === 0}
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20 disabled:opacity-30"
            >
              <ChevronLeft className="h-8 w-8" />
            </Button>
            <Button
              onClick={(e) => { e.stopPropagation(); nextSlide(); }}
              disabled={currentSlide === totalSlides - 1}
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20 disabled:opacity-30"
            >
              <ChevronRight className="h-8 w-8" />
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Wrapped;
