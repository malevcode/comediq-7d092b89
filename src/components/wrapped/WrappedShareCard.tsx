import { WrappedStats } from '@/hooks/useWrapped';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import NYCBoroughMap from './NYCBoroughMap';

interface WrappedShareCardProps {
  stats: WrappedStats;
  stageName?: string;
  headshotUrl?: string;
  year?: number;
}

const WrappedShareCard = ({ 
  stats, 
  stageName, 
  headshotUrl,
  year = 2025,
}: WrappedShareCardProps) => {
  // Find busiest month
  const busiestMonth = stats.monthlyBreakdown.reduce((max, current) => 
    current.count > max.count ? current : max, 
    { month: '', count: 0 }
  );

  const boroughText = stats.uniqueBoroughs.length === 5 
    ? 'ALL FIVE BOROUGHS!' 
    : stats.uniqueBoroughs.length === 1 
      ? stats.uniqueBoroughs[0].toUpperCase() + '!'
      : `${stats.uniqueBoroughs.length} BOROUGHS!`;

  return (
    <div 
      id="wrapped-share-card"
      className="relative bg-[#2a2a2a] text-white w-full h-full"
      style={{ width: '1080px', height: '1920px' }}
    >
      {/* Header - Your Comediq */}
      <div className="absolute top-[48px] left-[48px]">
        <p className="font-fredoka text-[36px] font-bold tracking-wide text-white/90">YOUR</p>
        <p className="font-fredoka text-[72px] font-bold tracking-tight leading-none -mt-2">COMEDIQ</p>
      </div>

      {/* Profile pic and name (top right) */}
      {(stageName || headshotUrl) && (
        <div className="absolute top-[48px] right-[48px] flex items-center gap-6">
          {stageName && (
            <p className="font-fredoka text-[36px] font-bold text-white/90">{stageName}</p>
          )}
          {headshotUrl && (
            <Avatar className="w-[80px] h-[80px] border-4 border-white/30">
              <AvatarImage src={headshotUrl} alt={stageName || 'Comedian'} />
              <AvatarFallback className="bg-white/20 text-white text-3xl font-fredoka">
                {stageName?.charAt(0) || '?'}
              </AvatarFallback>
            </Avatar>
          )}
        </div>
      )}

      {/* 2025 WRAPPED Title */}
      <div className="absolute top-[200px] left-0 right-0 text-center">
        <p 
          className="font-fredoka text-[120px] font-black italic leading-none"
          style={{ 
            WebkitTextStroke: '4px #6366f1',
            color: 'transparent',
            letterSpacing: '0.05em'
          }}
        >
          {year}
        </p>
        <p className="font-fredoka text-[180px] font-black leading-none -mt-4 tracking-tight">
          WRAPPED
        </p>
      </div>

      {/* Left Column Stats */}
      <div className="absolute left-[48px] top-[580px]">
        {/* Number of Mics */}
        <div className="mb-[80px]">
          <p className="font-fredoka text-[28px] font-bold tracking-wider text-white/80 mb-2">
            NUMBER OF MICS DONE
          </p>
          <p className="font-fredoka font-black leading-none text-[220px] tracking-tight">
            {stats.totalPerformances}
          </p>
        </div>

        {/* Total Minutes */}
        <div className="mb-[80px]">
          <p className="font-fredoka text-[28px] font-bold tracking-wider text-white/80 mb-2">
            TOTAL MINUTES ON STAGE
          </p>
          <p className="font-fredoka font-black leading-none text-[200px] tracking-tight">
            {stats.estimatedStageTime}
          </p>
        </div>

        {/* Unique Venues */}
        <div>
          <p className="font-fredoka text-[28px] font-bold tracking-wider text-white/80 mb-2">
            UNIQUE VENUES
          </p>
          <p className="font-fredoka font-black leading-none text-[200px] tracking-tight">
            {stats.uniqueVenues}
          </p>
        </div>
      </div>

      {/* Right Column - Borough Map */}
      <div className="absolute right-[48px] top-[620px] w-[420px]">
        <p className="font-fredoka text-[28px] font-bold tracking-wider text-white/80 mb-4">
          YOU PERFORMED IN...
        </p>
        <div className="w-full h-[380px]">
          <NYCBoroughMap 
            visitedBoroughs={stats.uniqueBoroughs} 
            className="w-full h-full"
          />
        </div>
        <p className="font-fredoka text-[42px] font-bold text-center mt-4 tracking-wide">
          {boroughText}
        </p>
      </div>

      {/* Busiest Month - if available */}
      {busiestMonth.count > 0 && (
        <div className="absolute right-[48px] top-[1150px] text-right">
          <p className="font-fredoka text-[28px] font-bold tracking-wider text-white/80 mb-2">
            BUSIEST MONTH
          </p>
          <p className="font-fredoka text-[72px] font-black leading-none">
            {busiestMonth.month.toUpperCase()}
          </p>
          <p className="font-fredoka text-[32px] text-white/70 mt-2">
            {busiestMonth.count} performances
          </p>
        </div>
      )}

      {/* Good Job Message */}
      <div className="absolute bottom-[180px] right-[48px]">
        <p 
          className="font-fredoka font-black tracking-tight text-[100px] leading-none"
          style={{ 
            WebkitTextStroke: '3px #ffffff',
            color: 'transparent'
          }}
        >
          GOOD JOB!
        </p>
      </div>

      {/* Footer */}
      <div className="absolute bottom-[48px] right-[48px]">
        <p className="font-fredoka text-[32px] font-bold tracking-wider text-white/60">
          COMEDIQ.COM/WRAPPED
        </p>
      </div>
    </div>
  );
};

export default WrappedShareCard;
