import { WrappedStats } from '@/hooks/useWrapped';
import NYCBoroughMap from './NYCBoroughMap';

interface WrappedShareCardProps {
  stats: WrappedStats;
  stageName?: string;
  headshotUrl?: string;
  year?: number;
}

const WrappedShareCard = ({ 
  stats, 
  year = 2025,
}: WrappedShareCardProps) => {
  const boroughText = stats.uniqueBoroughs.length === 5 
    ? 'ALL FIVE BOROUGHS!' 
    : stats.uniqueBoroughs.length === 1 
      ? stats.uniqueBoroughs[0].toUpperCase() + '!'
      : `${stats.uniqueBoroughs.length} BOROUGHS!`;

  return (
    <div 
      id="wrapped-share-card"
      className="relative bg-[#2a2a2a] text-white w-full h-full flex flex-col"
      style={{ 
        aspectRatio: '9/16',
        padding: '5%',
        fontFamily: 'Fredoka, sans-serif'
      }}
    >
      {/* Top Section: Header + 2025 */}
      <div className="flex justify-between items-start">
        {/* YOUR COMEDIQ - left aligned */}
        <div>
          <p 
            className="font-bold tracking-wide text-white/90 leading-none"
            style={{ fontSize: 'clamp(12px, 4%, 20px)' }}
          >
            YOUR
          </p>
          <p 
            className="font-bold tracking-tight leading-none"
            style={{ fontSize: 'clamp(24px, 8%, 40px)' }}
          >
            COMEDIQ
          </p>
        </div>
        
        {/* 2025 - right aligned, outlined */}
        <p 
          className="font-black italic leading-none"
          style={{ 
            fontSize: 'clamp(36px, 12%, 64px)',
            WebkitTextStroke: '2px #6366f1',
            color: 'transparent',
            letterSpacing: '0.05em'
          }}
        >
          {year}
        </p>
      </div>

      {/* WRAPPED Title - full width, centered */}
      <div className="text-center" style={{ marginTop: '2%' }}>
        <p 
          className="font-black leading-none tracking-tight"
          style={{ fontSize: 'clamp(48px, 16%, 96px)' }}
        >
          WRAPPED
        </p>
      </div>

      {/* Two-column layout for stats and map */}
      <div className="flex flex-1" style={{ marginTop: '6%', gap: '4%' }}>
        {/* Left Column - Stats */}
        <div className="flex-1 flex flex-col justify-start" style={{ gap: '8%' }}>
          {/* Number of Mics */}
          <div>
            <p 
              className="font-bold tracking-wider text-white/80 leading-tight"
              style={{ fontSize: 'clamp(8px, 2.5%, 14px)' }}
            >
              NUMBER OF MICS DONE
            </p>
            <p 
              className="font-black leading-none tracking-tight"
              style={{ fontSize: 'clamp(64px, 20%, 128px)' }}
            >
              {stats.totalPerformances}
            </p>
          </div>

          {/* Total Minutes */}
          <div>
            <p 
              className="font-bold tracking-wider text-white/80 leading-tight"
              style={{ fontSize: 'clamp(8px, 2.5%, 14px)' }}
            >
              TOTAL MINUTES ON STAGE
            </p>
            <p 
              className="font-black leading-none tracking-tight"
              style={{ fontSize: 'clamp(48px, 16%, 96px)' }}
            >
              {stats.estimatedStageTime}
            </p>
          </div>

          {/* Unique Venues */}
          <div>
            <p 
              className="font-bold tracking-wider text-white/80 leading-tight"
              style={{ fontSize: 'clamp(8px, 2.5%, 14px)' }}
            >
              UNIQUE VENUES
            </p>
            <p 
              className="font-black leading-none tracking-tight"
              style={{ fontSize: 'clamp(48px, 16%, 96px)' }}
            >
              {stats.uniqueVenues}
            </p>
          </div>
        </div>

        {/* Right Column - Map */}
        <div className="flex flex-col items-center" style={{ width: '42%' }}>
          <p 
            className="font-bold tracking-wider text-white/80 text-center leading-tight"
            style={{ fontSize: 'clamp(8px, 2.5%, 14px)', marginBottom: '4%' }}
          >
            YOU PERFORMED IN...
          </p>
          <div style={{ width: '100%', aspectRatio: '1' }}>
            <NYCBoroughMap 
              visitedBoroughs={stats.uniqueBoroughs} 
              className="w-full h-full"
            />
          </div>
          <p 
            className="font-bold text-center tracking-wide"
            style={{ fontSize: 'clamp(12px, 4%, 24px)', marginTop: '4%' }}
          >
            {boroughText}
          </p>
          
          {/* GOOD JOB - outlined text */}
          <p 
            className="font-black tracking-tight leading-none"
            style={{ 
              fontSize: 'clamp(24px, 8%, 48px)',
              WebkitTextStroke: '1.5px #ffffff',
              color: 'transparent',
              marginTop: '8%'
            }}
          >
            GOOD JOB!
          </p>
        </div>
      </div>

      {/* Footer URL */}
      <div className="text-right" style={{ marginTop: 'auto', paddingTop: '4%' }}>
        <p 
          className="font-bold tracking-wider text-white/60"
          style={{ fontSize: 'clamp(10px, 3%, 16px)' }}
        >
          COMEDIQ.COM/WRAPPED
        </p>
      </div>
    </div>
  );
};

export default WrappedShareCard;
