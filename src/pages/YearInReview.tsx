import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, MapPin, Calendar, Users, Heart, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import WrappedSlide from '@/components/wrapped/WrappedSlide';
import AnimatedCounter from '@/components/wrapped/AnimatedCounter';
import ProgressDots from '@/components/wrapped/ProgressDots';
import BoroughBreakdownChart from '@/components/year-review/BoroughBreakdownChart';
import BusiestDaysChart from '@/components/year-review/BusiestDaysChart';
import { usePlatformStats } from '@/hooks/usePlatformStats';
import SEO from '@/components/SEO';
import { Skeleton } from '@/components/ui/skeleton';

const YearInReview = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [animateCharts, setAnimateCharts] = useState(false);
  const { data: stats, isLoading, error } = usePlatformStats();
  
  const totalSlides = 6;

  useEffect(() => {
    // Trigger chart animations when slide changes
    setAnimateCharts(false);
    const timer = setTimeout(() => setAnimateCharts(true), 100);
    return () => clearTimeout(timer);
  }, [currentSlide]);

  const nextSlide = () => {
    if (currentSlide < totalSlides - 1) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowRight' || e.key === ' ') {
      nextSlide();
    } else if (e.key === 'ArrowLeft') {
      prevSlide();
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentSlide]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-comediq-blue flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-6xl animate-bounce">🎤</div>
          <p className="text-comediq-cream font-nunito text-lg">Loading 2025 stats...</p>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="min-h-screen bg-comediq-blue flex items-center justify-center p-8">
        <div className="text-center space-y-4">
          <div className="text-6xl">😅</div>
          <p className="text-comediq-cream font-nunito text-lg">Couldn't load stats. Try again later!</p>
          <Link to="/">
            <Button variant="outline" className="border-comediq-cream text-comediq-cream hover:bg-comediq-cream hover:text-comediq-blue">
              Go Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const busiestDay = stats.dayStats[0];

  return (
    <>
      <SEO
        title="Comediq 2025 Year in Review - NYC Comedy Stats"
        description="Discover the NYC comedy scene by the numbers. See how many open mics, comedians, and neighborhoods Comediq tracked in 2025."
        url="https://comediq.us/2025-review"
      />
      
      <div className="relative min-h-screen overflow-hidden">
        {/* Slide 0: Welcome */}
        <WrappedSlide slideIndex={0} isActive={currentSlide === 0}>
          <div className="text-center space-y-8 animate-fade-in">
            <div className="text-7xl mb-6 animate-bounce">🎤</div>
            <h1 className="font-fredoka text-5xl md:text-6xl text-comediq-cream tracking-tight">
              COMEDIQ
            </h1>
            <div className="font-fredoka text-6xl md:text-7xl text-yellow-300 font-bold">
              2025
            </div>
            <p className="font-nunito text-xl text-comediq-cream/80">
              Year in Review
            </p>
            <p className="font-nunito text-comediq-cream/60 text-sm mt-8">
              The NYC comedy scene, by the numbers
            </p>
            <div className="mt-12 animate-pulse">
              <p className="text-comediq-cream/50 text-sm">Tap or swipe to continue →</p>
            </div>
          </div>
        </WrappedSlide>

        {/* Slide 1: Total Mics */}
        <WrappedSlide slideIndex={1} isActive={currentSlide === 1}>
          <div className="text-center space-y-6 animate-fade-in">
            <MapPin className="w-16 h-16 text-comediq-cream/60 mx-auto mb-4" />
            <p className="font-nunito text-xl text-comediq-cream/80">
              We tracked
            </p>
            <div className="font-fredoka text-8xl md:text-9xl text-comediq-cream font-bold">
              <AnimatedCounter value={stats.totalMics} duration={2000} />
            </div>
            <p className="font-fredoka text-3xl text-yellow-300">
              OPEN MICS
            </p>
            <p className="font-nunito text-comediq-cream/70">
              across NYC this year
            </p>
            <div className="flex justify-center gap-6 mt-8 text-sm text-comediq-cream/60">
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 bg-green-400 rounded-full"></span>
                {stats.activeMics} active
              </span>
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 bg-gray-400 rounded-full"></span>
                {stats.inactiveMics} inactive
              </span>
            </div>
          </div>
        </WrappedSlide>

        {/* Slide 2: Borough Breakdown */}
        <WrappedSlide slideIndex={2} isActive={currentSlide === 2}>
          <div className="text-center space-y-6 animate-fade-in">
            <p className="font-nunito text-lg text-comediq-cream/80">
              Manhattan dominated with
            </p>
            <div className="font-fredoka text-7xl md:text-8xl text-comediq-cream font-bold">
              <AnimatedCounter value={stats.boroughStats[0]?.count || 0} duration={1500} />
            </div>
            <p className="font-fredoka text-2xl text-yellow-300 mb-8">
              MICS
            </p>
            <BoroughBreakdownChart 
              boroughStats={stats.boroughStats} 
              animate={animateCharts && currentSlide === 2}
            />
          </div>
        </WrappedSlide>

        {/* Slide 3: Busiest Days */}
        <WrappedSlide slideIndex={3} isActive={currentSlide === 3}>
          <div className="text-center space-y-6 animate-fade-in">
            <Calendar className="w-12 h-12 text-comediq-cream/60 mx-auto" />
            <p className="font-nunito text-lg text-comediq-cream/80">
              {busiestDay?.day} is NYC's mic night!
            </p>
            <div className="font-fredoka text-7xl md:text-8xl text-yellow-300 font-bold">
              <AnimatedCounter value={busiestDay?.count || 0} duration={1500} />
            </div>
            <p className="font-fredoka text-2xl text-comediq-cream mb-6">
              WEEKLY MICS
            </p>
            <BusiestDaysChart 
              dayStats={stats.dayStats} 
              animate={animateCharts && currentSlide === 3}
            />
          </div>
        </WrappedSlide>

        {/* Slide 4: Community Stats */}
        <WrappedSlide slideIndex={4} isActive={currentSlide === 4}>
          <div className="text-center space-y-8 animate-fade-in">
            <Users className="w-16 h-16 text-comediq-cream/60 mx-auto" />
            <div className="font-fredoka text-7xl md:text-8xl text-comediq-cream font-bold">
              <AnimatedCounter value={stats.totalUsers} duration={2000} />
            </div>
            <p className="font-fredoka text-2xl text-yellow-300">
              COMEDIANS
            </p>
            <p className="font-nunito text-xl text-comediq-cream/80">
              joined Comediq
            </p>
            <div className="grid grid-cols-2 gap-6 mt-8 max-w-xs mx-auto">
              <div className="bg-white/10 rounded-xl p-4">
                <div className="font-fredoka text-3xl text-comediq-cream">
                  {stats.freeMics}
                </div>
                <p className="text-xs text-comediq-cream/60 mt-1">free mics</p>
                <p className="text-xs text-yellow-300">({stats.freePercentage}%!)</p>
              </div>
              <div className="bg-white/10 rounded-xl p-4">
                <div className="font-fredoka text-3xl text-comediq-cream">
                  {stats.neighborhoods}
                </div>
                <p className="text-xs text-comediq-cream/60 mt-1">neighborhoods</p>
              </div>
            </div>
          </div>
        </WrappedSlide>

        {/* Slide 5: Engagement & CTA */}
        <WrappedSlide slideIndex={5} isActive={currentSlide === 5}>
          <div className="text-center space-y-6 animate-fade-in">
            <Sparkles className="w-12 h-12 text-yellow-300 mx-auto" />
            <h2 className="font-fredoka text-3xl text-comediq-cream">
              Community Love
            </h2>
            
            <div className="grid grid-cols-3 gap-4 mt-6">
              <div className="bg-white/10 rounded-xl p-4">
                <div className="font-fredoka text-2xl text-comediq-cream">
                  <AnimatedCounter value={stats.totalVisits} duration={1500} />
                </div>
                <p className="text-xs text-comediq-cream/60 mt-1">visits</p>
              </div>
              <div className="bg-white/10 rounded-xl p-4">
                <div className="font-fredoka text-2xl text-comediq-cream">
                  <AnimatedCounter value={stats.totalRatings} duration={1500} />
                </div>
                <p className="text-xs text-comediq-cream/60 mt-1">ratings</p>
              </div>
              <div className="bg-white/10 rounded-xl p-4">
                <div className="font-fredoka text-2xl text-comediq-cream">
                  <AnimatedCounter value={stats.savedMics} duration={1500} />
                </div>
                <p className="text-xs text-comediq-cream/60 mt-1">saved</p>
              </div>
            </div>

            <div className="mt-10 space-y-4">
              <p className="font-nunito text-comediq-cream/80">
                Ready to find your next mic?
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link to="/auth">
                  <Button className="bg-yellow-400 hover:bg-yellow-300 text-comediq-blue-dark font-bold px-8">
                    Sign Up Free
                  </Button>
                </Link>
                <Link to="/open-mics">
                  <Button variant="outline" className="border-comediq-cream text-comediq-cream hover:bg-comediq-cream hover:text-comediq-blue">
                    Find Mics
                  </Button>
                </Link>
              </div>
            </div>

            <p className="text-comediq-cream/40 text-xs mt-8">
              Made with ❤️ by comedians, for comedians
            </p>
          </div>
        </WrappedSlide>

        {/* Navigation Controls */}
        <div className="fixed bottom-8 left-0 right-0 z-50 px-4">
          <div className="max-w-lg mx-auto flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              onClick={prevSlide}
              disabled={currentSlide === 0}
              className="text-comediq-cream/80 hover:text-comediq-cream hover:bg-white/10 disabled:opacity-30"
            >
              <ChevronLeft className="w-8 h-8" />
            </Button>
            
            <ProgressDots 
              total={totalSlides} 
              current={currentSlide} 
              onDotClick={setCurrentSlide}
            />
            
            <Button
              variant="ghost"
              size="icon"
              onClick={nextSlide}
              disabled={currentSlide === totalSlides - 1}
              className="text-comediq-cream/80 hover:text-comediq-cream hover:bg-white/10 disabled:opacity-30"
            >
              <ChevronRight className="w-8 h-8" />
            </Button>
          </div>
        </div>

        {/* Click to navigate */}
        <div 
          className="fixed inset-0 z-40 flex"
          onClick={(e) => {
            const rect = (e.target as HTMLElement).getBoundingClientRect();
            const x = e.clientX - rect.left;
            if (x > rect.width / 2) {
              nextSlide();
            } else {
              prevSlide();
            }
          }}
        >
          <div className="w-1/2 h-full cursor-w-resize" />
          <div className="w-1/2 h-full cursor-e-resize" />
        </div>
      </div>
    </>
  );
};

export default YearInReview;
