import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface WrappedSlideProps {
  children: ReactNode;
  slideIndex?: number;
  isActive?: boolean;
  className?: string;
}

// Different gradient variations using Comediq brand colors
const getSlideGradient = (index: number) => {
  const gradients = [
    'from-comediq-blue-dark via-comediq-blue to-comediq-blue-light', // Welcome
    'from-comediq-blue via-comediq-blue-dark to-[hsl(250,60%,30%)]', // Total mics
    'from-[hsl(280,50%,35%)] via-comediq-blue-dark to-comediq-blue', // Stage time
    'from-comediq-blue-light via-comediq-blue to-comediq-blue-dark', // Top venue
    'from-[hsl(200,70%,35%)] via-comediq-blue to-comediq-blue-dark', // Favorite day
    'from-comediq-blue-dark via-[hsl(230,60%,35%)] to-comediq-blue', // Boroughs
    'from-comediq-blue via-comediq-blue-dark to-[hsl(260,50%,30%)]', // Summary
  ];
  return gradients[index % gradients.length];
};

const WrappedSlide = ({ 
  children, 
  slideIndex = 0,
  isActive = true,
  className 
}: WrappedSlideProps) => {
  if (!isActive) return null;

  return (
    <div 
      className={cn(
        'min-h-[100vh] flex flex-col items-center justify-center p-8 relative overflow-hidden',
        `bg-gradient-to-br ${getSlideGradient(slideIndex)}`,
        className
      )}
    >
      {/* Animated background patterns */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Floating microphones */}
        {[...Array(6)].map((_, i) => (
          <div
            key={`mic-${i}`}
            className="absolute text-comediq-cream/5 animate-float"
            style={{
              left: `${5 + (i * 18)}%`,
              top: `${15 + (i % 3) * 30}%`,
              animationDelay: `${i * 1.2}s`,
              fontSize: `${50 + (i % 4) * 15}px`,
            }}
          >
            🎤
          </div>
        ))}
        
        {/* Glowing orbs */}
        <div className="absolute top-1/4 -left-20 w-64 h-64 bg-comediq-cream/5 rounded-full blur-3xl animate-pulse-glow" />
        <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-comediq-blue-light/10 rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: '1s' }} />
        
        {/* Subtle grid pattern */}
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: 'radial-gradient(circle, hsl(var(--comediq-cream)) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-lg mx-auto">
        {children}
      </div>
    </div>
  );
};

export default WrappedSlide;
