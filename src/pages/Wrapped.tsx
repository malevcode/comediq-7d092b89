import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useWrapped } from '@/hooks/useWrapped';
import { useComedianProfile } from '@/hooks/useComedianProfile';
import SEO from '@/components/SEO';
import WrappedSlide from '@/components/wrapped/WrappedSlide';
import WrappedShareCard from '@/components/wrapped/WrappedShareCard';
import AnimatedCounter from '@/components/wrapped/AnimatedCounter';
import ProgressDots from '@/components/wrapped/ProgressDots';
import { Button } from '@/components/ui/button';
import { 
  Mic, 
  Clock, 
  Building2, 
  ChevronRight, 
  ChevronLeft,
  Share2,
  Home,
  LogIn,
  Sparkles,
  Download
} from 'lucide-react';

const YEAR = 2025;

const Wrapped = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const { data: stats, isLoading: statsLoading } = useWrapped(user?.id, YEAR);
  const { data: profile } = useComedianProfile(user?.id);

  const totalSlides = 5; // 4 content slides + 1 shareable summary

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

  // Floating microphone background component
  const FloatingMics = () => (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(8)].map((_, i) => (
        <div
          key={i}
          className="absolute text-comediq-cream/10 animate-float"
          style={{
            left: `${10 + (i * 12)}%`,
            top: `${20 + (i % 3) * 25}%`,
            animationDelay: `${i * 0.8}s`,
            fontSize: `${40 + (i % 3) * 20}px`,
          }}
        >
          🎤
        </div>
      ))}
    </div>
  );

  // Not logged in
  if (!authLoading && !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-comediq-blue-dark via-comediq-blue to-comediq-blue-light flex flex-col items-center justify-center p-6 relative overflow-hidden">
        <SEO title="Comediq Wrapped 2025" description="See your comedy year in review" noindex />
        <FloatingMics />
        <div className="relative z-10 flex flex-col items-center">
          <div className="text-6xl mb-6 animate-float">🎤</div>
          <h1 className="font-fredoka text-5xl font-bold text-comediq-cream text-center mb-4 tracking-tight">
            COMEDIQ
          </h1>
          <p className="font-fredoka text-2xl text-comediq-cream/80 mb-8 text-center">
            WRAPPED {YEAR}
          </p>
          <p className="font-nunito text-lg text-comediq-cream/70 mb-8 text-center">
            Sign in to see your comedy journey
          </p>
          <Button 
            onClick={() => navigate('/auth')} 
            size="lg" 
            className="bg-comediq-cream text-comediq-blue hover:bg-comediq-cream/90 font-fredoka font-bold text-lg px-8"
          >
            <LogIn className="mr-2 h-5 w-5" />
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  // Loading
  if (authLoading || statsLoading || !stats) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-comediq-blue-dark via-comediq-blue to-comediq-blue-light flex flex-col items-center justify-center p-6 relative overflow-hidden">
        <SEO title="Comediq Wrapped 2025" description="See your comedy year in review" noindex />
        <FloatingMics />
        <div className="relative z-10 flex flex-col items-center">
          <div className="text-6xl mb-6 animate-pulse">🎤</div>
          <h1 className="font-fredoka text-2xl font-bold text-comediq-cream">Loading your year...</h1>
        </div>
      </div>
    );
  }

  // No data
  if (stats.totalPerformances === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-comediq-blue-dark via-comediq-blue to-comediq-blue-light flex flex-col items-center justify-center p-6 relative overflow-hidden">
        <SEO title="Comediq Wrapped 2025" description="See your comedy year in review" noindex />
        <FloatingMics />
        <div className="relative z-10 flex flex-col items-center">
          <Mic className="h-16 w-16 text-comediq-cream/50 mb-6" />
          <h1 className="font-fredoka text-4xl font-bold text-comediq-cream mb-4 text-center">
            NO PERFORMANCES YET?
          </h1>
          <p className="font-nunito text-lg text-comediq-cream/80 mb-8 text-center max-w-md">
            You haven't tracked any mics or shows in {YEAR} yet. Start tracking to get your wrapped!
          </p>
          <Button 
            onClick={() => navigate('/open-mics')} 
            size="lg" 
            className="bg-comediq-cream text-comediq-blue hover:bg-comediq-cream/90 font-fredoka font-bold"
          >
            Find Open Mics
          </Button>
        </div>
      </div>
    );
  }

  const hours = Math.floor(stats.estimatedStageTime / 60);
  const minutes = stats.estimatedStageTime % 60;

  // Calculate fun facts
  const specialsEquivalent = (stats.estimatedStageTime / 60).toFixed(1);

  const renderSlide = () => {
    switch (currentSlide) {
      // Slide 0: Welcome/Intro
      case 0:
        return (
          <WrappedSlide slideIndex={0}>
            <div className="flex flex-col items-center animate-slide-up">
              <div className="text-8xl mb-8 animate-float">🎤</div>
              <p className="font-nunito text-lg text-comediq-cream/60 tracking-widest mb-2">EST. 2025</p>
              <h1 className="font-fredoka text-6xl md:text-8xl font-bold text-comediq-cream text-center mb-2 tracking-tight">
                COMEDIQ
              </h1>
              <p className="font-fredoka text-3xl md:text-4xl text-comediq-cream/90 font-medium text-center mb-8">
                WRAPPED {YEAR}
              </p>
              <div className="mt-8 flex items-center gap-2 text-comediq-cream/60 font-nunito">
                <span>Tap to continue</span>
                <ChevronRight className="h-5 w-5 animate-pulse" />
              </div>
            </div>
          </WrappedSlide>
        );

      // Slide 1: Total Performances (mics + shows breakdown)
      case 1:
        return (
          <WrappedSlide slideIndex={1}>
            <div className="flex flex-col items-center animate-slide-up">
              <div className="bg-comediq-cream/20 p-6 rounded-full mb-8 animate-pulse-glow">
                <Sparkles className="h-16 w-16 text-comediq-cream" />
              </div>
              <p className="font-nunito text-xl text-comediq-cream/80 mb-4">This year you performed at</p>
              <div className="font-fredoka text-9xl md:text-[12rem] font-bold text-comediq-cream mb-4 leading-none animate-count-up">
                <AnimatedCounter value={stats.totalPerformances} />
              </div>
              <p className="font-fredoka text-3xl text-comediq-cream font-bold mb-8">
                {stats.totalPerformances === 1 ? 'PERFORMANCE' : 'PERFORMANCES'}
              </p>
              <div className="flex gap-6 bg-comediq-cream/10 px-8 py-4 rounded-2xl">
                <div className="text-center">
                  <p className="font-fredoka text-4xl font-bold text-comediq-cream">{stats.totalMics}</p>
                  <p className="font-nunito text-sm text-comediq-cream/70">Open Mics</p>
                </div>
                <div className="w-px bg-comediq-cream/30" />
                <div className="text-center">
                  <p className="font-fredoka text-4xl font-bold text-comediq-cream">{stats.totalShows}</p>
                  <p className="font-nunito text-sm text-comediq-cream/70">Shows</p>
                </div>
              </div>
            </div>
          </WrappedSlide>
        );

      // Slide 2: Time on Stage
      case 2:
        return (
          <WrappedSlide slideIndex={2}>
            <div className="flex flex-col items-center animate-slide-up">
              <div className="bg-comediq-cream/20 p-6 rounded-full mb-8 animate-pulse-glow">
                <Clock className="h-16 w-16 text-comediq-cream" />
              </div>
              <p className="font-nunito text-xl text-comediq-cream/80 mb-6">You spent</p>
              <div className="flex items-baseline gap-4 mb-6">
                {hours > 0 && (
                  <>
                    <span className="font-fredoka text-8xl md:text-9xl font-bold text-comediq-cream leading-none">
                      <AnimatedCounter value={hours} />
                    </span>
                    <span className="font-nunito text-2xl text-comediq-cream/80">hours</span>
                  </>
                )}
                <span className="font-fredoka text-8xl md:text-9xl font-bold text-comediq-cream leading-none">
                  <AnimatedCounter value={minutes} />
                </span>
                <span className="font-nunito text-2xl text-comediq-cream/80">min</span>
              </div>
              <p className="font-fredoka text-3xl text-comediq-cream font-bold">ON STAGE</p>
              <div className="mt-8 bg-comediq-cream/10 px-6 py-3 rounded-2xl">
                <p className="font-nunito text-lg text-comediq-cream/80 text-center">
                  That's like <span className="font-bold text-comediq-cream">{specialsEquivalent}</span> hour-long specials! 🎬
                </p>
              </div>
            </div>
          </WrappedSlide>
        );

      // Slide 3: Top Spots (venue + boroughs)
      case 3:
        return (
          <WrappedSlide slideIndex={3}>
            <div className="flex flex-col items-center animate-slide-up">
              <div className="bg-comediq-cream/20 p-6 rounded-full mb-8 animate-pulse-glow">
                <Building2 className="h-16 w-16 text-comediq-cream" />
              </div>
              <p className="font-nunito text-xl text-comediq-cream/80 mb-6">Your favorite spot was</p>
              <h2 className="font-fredoka text-4xl md:text-5xl font-bold text-comediq-cream text-center mb-6 px-4 leading-tight">
                {stats.topVenue?.name || 'N/A'}
              </h2>
              {stats.topVenue && (
                <div className="bg-comediq-cream/20 px-8 py-4 rounded-2xl mb-8">
                  <p className="font-fredoka text-2xl text-comediq-cream">
                    <span className="font-bold">{stats.topVenue.count}</span> visits!
                  </p>
                </div>
              )}
              <div className="text-center">
                <p className="font-nunito text-lg text-comediq-cream/70 mb-3">
                  {stats.uniqueVenues} venues across {stats.uniqueBoroughs.length} boroughs
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {stats.uniqueBoroughs.map(borough => (
                    <span
                      key={borough}
                      className="bg-comediq-cream/20 px-4 py-1.5 rounded-full font-fredoka text-sm text-comediq-cream font-medium"
                    >
                      {borough}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </WrappedSlide>
        );

      // Slide 4: Shareable Summary Card (Instagram Story sized - 1080x1920)
      case 4:
        return (
          <WrappedSlide slideIndex={4} className="!py-2 !px-0">
            <div className="flex flex-col items-center animate-slide-up">
              <h2 className="font-fredoka text-xl font-bold text-comediq-cream mb-4 text-center px-4">
                YOUR {YEAR} WRAPPED
              </h2>
              {/* Scaled preview of 1080x1920 card */}
              <div 
                className="origin-top overflow-hidden rounded-xl shadow-2xl"
                style={{ 
                  transform: 'scale(0.18)',
                  width: '1080px',
                  height: '1920px',
                  marginBottom: '-1580px' // Compensate for scale to prevent layout issues
                }}
              >
                <WrappedShareCard 
                  stats={stats} 
                  stageName={profile?.stage_name || profile?.username}
                  headshotUrl={profile?.headshot_url}
                  year={YEAR}
                />
              </div>
              <div className="flex gap-3 mt-8">
                <Button
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({
                        title: 'My Comediq Wrapped 2025',
                        text: `I performed ${stats.totalPerformances} times in ${YEAR}! Check out your comedy wrapped on Comediq.`,
                        url: window.location.href,
                      });
                    }
                  }}
                  size="sm"
                  className="bg-comediq-cream text-comediq-blue hover:bg-comediq-cream/90 font-fredoka font-bold px-6"
                >
                  <Share2 className="mr-2 h-4 w-4" />
                  Share
                </Button>
                <Button
                  onClick={() => navigate('/profile')}
                  size="sm"
                  variant="outline"
                  className="border-comediq-cream text-comediq-cream hover:bg-comediq-cream/20 font-fredoka px-4"
                >
                  <Home className="mr-2 h-4 w-4" />
                  Home
                </Button>
              </div>
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
        description="See your comedy year in review - total performances, stage time, favorite venues, and more!"
        noindex 
      />
      <div 
        className="min-h-screen bg-comediq-blue-dark relative overflow-hidden"
        onClick={(e) => {
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
        <div className="fixed bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-comediq-blue-dark/90 to-transparent pb-6 pt-12">
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
              className="text-comediq-cream hover:bg-comediq-cream/20 disabled:opacity-30"
            >
              <ChevronLeft className="h-8 w-8" />
            </Button>
            <Button
              onClick={(e) => { e.stopPropagation(); nextSlide(); }}
              disabled={currentSlide === totalSlides - 1}
              variant="ghost"
              size="icon"
              className="text-comediq-cream hover:bg-comediq-cream/20 disabled:opacity-30"
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
