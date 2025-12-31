import { WrappedStats } from '@/hooks/useWrapped';
import { Share2, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface WrappedShareCardProps {
  stats: WrappedStats;
  stageName?: string;
  headshotUrl?: string;
  year?: number;
  onShare?: () => void;
}

// NYC Borough Map SVG Component
const NYCBoroughMap = ({ boroughs }: { boroughs: string[] }) => {
  const boroughColors: Record<string, string> = {
    'Manhattan': boroughs.includes('Manhattan') ? '#ffffff' : '#4a4a4a',
    'Brooklyn': boroughs.includes('Brooklyn') ? '#ffffff' : '#4a4a4a',
    'Queens': boroughs.includes('Queens') ? '#ffffff' : '#4a4a4a',
    'Bronx': boroughs.includes('Bronx') ? '#ffffff' : '#4a4a4a',
    'Staten Island': boroughs.includes('Staten Island') ? '#ffffff' : '#4a4a4a',
  };

  return (
    <svg viewBox="0 0 200 180" className="w-full h-full" fill="none">
      {/* Simplified NYC borough shapes */}
      {/* Bronx */}
      <path 
        d="M100 10 L140 15 L150 40 L130 55 L100 50 L90 30 Z" 
        fill={boroughColors['Bronx']} 
        stroke="#6b6b6b" 
        strokeWidth="1.5"
      />
      {/* Manhattan */}
      <path 
        d="M95 55 L105 52 L115 65 L115 100 L105 115 L95 110 L90 75 Z" 
        fill={boroughColors['Manhattan']} 
        stroke="#6b6b6b" 
        strokeWidth="1.5"
      />
      {/* Queens */}
      <path 
        d="M120 50 L165 45 L180 70 L175 110 L140 120 L120 100 L115 65 Z" 
        fill={boroughColors['Queens']} 
        stroke="#6b6b6b" 
        strokeWidth="1.5"
      />
      {/* Brooklyn */}
      <path 
        d="M90 115 L120 105 L145 125 L150 160 L110 170 L80 150 L75 125 Z" 
        fill={boroughColors['Brooklyn']} 
        stroke="#6b6b6b" 
        strokeWidth="1.5"
      />
      {/* Staten Island */}
      <path 
        d="M25 130 L55 125 L65 145 L60 175 L30 180 L20 160 Z" 
        fill={boroughColors['Staten Island']} 
        stroke="#6b6b6b" 
        strokeWidth="1.5"
      />
    </svg>
  );
};

const WrappedShareCard = ({ 
  stats, 
  stageName, 
  headshotUrl,
  year = 2025,
  onShare 
}: WrappedShareCardProps) => {
  // Find busiest month
  const busiestMonth = stats.monthlyBreakdown.reduce((max, current) => 
    current.count > max.count ? current : max, 
    { month: '', count: 0 }
  );

  // Get top 3 venues
  const topVenues = Object.entries(
    stats.monthlyBreakdown.reduce((acc, _) => acc, {} as Record<string, number>)
  );

  // Calculate unique days logged
  const daysLogged = stats.daysBreakdown.reduce((sum, d) => sum + d.count, 0);

  const boroughText = stats.uniqueBoroughs.length === 5 
    ? 'ALL FIVE BOROUGHS!' 
    : stats.uniqueBoroughs.length === 1 
      ? stats.uniqueBoroughs[0].toUpperCase() + '!'
      : `${stats.uniqueBoroughs.length} BOROUGHS!`;

  return (
    <div 
      id="wrapped-share-card"
      className="relative bg-[#2a2a2a] text-white overflow-hidden"
      style={{ width: '1080px', height: '1920px' }}
    >
      {/* Header - Your Comediq */}
      <div className="absolute top-12 left-12">
        <p className="font-fredoka text-2xl font-bold tracking-wide text-white/90">YOUR</p>
        <p className="font-fredoka text-5xl font-bold tracking-tight -mt-2">COMEDIQ</p>
      </div>

      {/* Profile pic and name (top right) */}
      {(stageName || headshotUrl) && (
        <div className="absolute top-12 right-12 flex items-center gap-4">
          {headshotUrl && (
            <Avatar className="w-16 h-16 border-2 border-white/30">
              <AvatarImage src={headshotUrl} alt={stageName || 'Comedian'} />
              <AvatarFallback className="bg-white/20 text-white text-xl">
                {stageName?.charAt(0) || '?'}
              </AvatarFallback>
            </Avatar>
          )}
          {stageName && (
            <p className="font-fredoka text-2xl font-bold text-white/90">{stageName}</p>
          )}
        </div>
      )}

      {/* 2025 WRAPPED Title */}
      <div className="absolute top-40 left-0 right-0 text-center">
        <p 
          className="font-fredoka text-7xl font-black italic"
          style={{ 
            WebkitTextStroke: '3px #6366f1',
            color: 'transparent',
            letterSpacing: '0.05em'
          }}
        >
          {year}
        </p>
        <p className="font-fredoka text-[140px] font-black leading-none -mt-6 tracking-tight">
          WRAPPED
        </p>
      </div>

      {/* Left Column Stats */}
      <div className="absolute left-12 top-[480px]">
        {/* Number of Mics */}
        <div className="mb-16">
          <p className="font-fredoka text-xl font-bold tracking-wider text-white/80 mb-2">
            NUMBER OF MICS DONE
          </p>
          <p 
            className="font-fredoka font-black leading-none"
            style={{ fontSize: '200px', letterSpacing: '-0.02em' }}
          >
            {stats.totalPerformances}
          </p>
        </div>

        {/* Total Minutes */}
        <div className="mb-16">
          <p className="font-fredoka text-xl font-bold tracking-wider text-white/80 mb-2">
            TOTAL MINUTES ON STAGE
          </p>
          <p 
            className="font-fredoka font-black leading-none"
            style={{ fontSize: '180px', letterSpacing: '-0.02em' }}
          >
            {stats.estimatedStageTime}
          </p>
        </div>

        {/* Days Logged */}
        <div>
          <p className="font-fredoka text-xl font-bold tracking-wider text-white/80 mb-2">
            DAYS LOGGED
          </p>
          <p 
            className="font-fredoka font-black leading-none"
            style={{ fontSize: '180px', letterSpacing: '-0.02em' }}
          >
            {stats.uniqueVenues}
          </p>
        </div>
      </div>

      {/* Right Column - Borough Map */}
      <div className="absolute right-12 top-[520px] w-[400px]">
        <p className="font-fredoka text-xl font-bold tracking-wider text-white/80 mb-4">
          YOU PERFORMED IN...
        </p>
        <div className="w-full h-[320px]">
          <NYCBoroughMap boroughs={stats.uniqueBoroughs} />
        </div>
        <p className="font-fredoka text-3xl font-bold text-center mt-4 tracking-wide">
          {boroughText}
        </p>
      </div>

      {/* Busiest Month - if available */}
      {busiestMonth.count > 0 && (
        <div className="absolute right-12 top-[920px] text-right">
          <p className="font-fredoka text-xl font-bold tracking-wider text-white/80 mb-2">
            BUSIEST MONTH
          </p>
          <p className="font-fredoka text-6xl font-black">
            {busiestMonth.month.toUpperCase()}
          </p>
          <p className="font-fredoka text-2xl text-white/70 mt-1">
            {busiestMonth.count} performances
          </p>
        </div>
      )}

      {/* Good Job Message */}
      <div className="absolute bottom-64 right-12">
        <p 
          className="font-fredoka font-black tracking-tight"
          style={{ 
            fontSize: '80px',
            WebkitTextStroke: '2px #ffffff',
            color: 'transparent'
          }}
        >
          GOOD JOB!
        </p>
      </div>

      {/* Footer */}
      <div className="absolute bottom-12 right-12">
        <p className="font-fredoka text-2xl font-bold tracking-wider text-white/60">
          COMEDIQ.COM/WRAPPED
        </p>
      </div>

      {/* Share Button (overlay) */}
      {onShare && (
        <Button
          onClick={onShare}
          className="absolute bottom-12 left-12 bg-white text-[#2a2a2a] hover:bg-white/90 font-fredoka font-bold text-xl px-8 py-6"
        >
          <Share2 className="mr-2 h-6 w-6" />
          SHARE
        </Button>
      )}
    </div>
  );
};

export default WrappedShareCard;
