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
      style={{ aspectRatio: '9/16' }}
    >
      {/* Header */}
      <div className="pt-[5%] pl-[5%]">
        <p className="font-fredoka text-[4vw] font-bold tracking-wide text-white/90 leading-tight">YOUR</p>
        <p className="font-fredoka text-[8vw] font-bold tracking-tight leading-none">COMEDIQ</p>
      </div>

      {/* 2025 WRAPPED Title */}
      <div className="mt-[4%] text-center">
        <p 
          className="font-fredoka text-[14vw] font-black italic leading-none"
          style={{ 
            WebkitTextStroke: '0.4vw #6366f1',
            color: 'transparent',
            letterSpacing: '0.05em'
          }}
        >
          {year}
        </p>
        <p className="font-fredoka text-[18vw] font-black leading-none -mt-[2%] tracking-tight">
          WRAPPED
        </p>
      </div>

      {/* Two-column layout for stats */}
      <div className="flex-1 flex mt-[6%] px-[5%]">
        {/* Left Column - Stats */}
        <div className="flex-1 flex flex-col justify-start">
          {/* Number of Mics */}
          <div className="mb-[12%]">
            <p className="font-fredoka text-[2.8vw] font-bold tracking-wider text-white/80 mb-[1%]">
              NUMBER OF MICS DONE
            </p>
            <p className="font-fredoka font-black leading-none text-[22vw] tracking-tight">
              {stats.totalPerformances}
            </p>
          </div>

          {/* Total Minutes */}
          <div className="mb-[12%]">
            <p className="font-fredoka text-[2.8vw] font-bold tracking-wider text-white/80 mb-[1%]">
              TOTAL MINUTES ON STAGE
            </p>
            <p className="font-fredoka font-black leading-none text-[18vw] tracking-tight">
              {stats.estimatedStageTime}
            </p>
          </div>

          {/* Unique Venues */}
          <div>
            <p className="font-fredoka text-[2.8vw] font-bold tracking-wider text-white/80 mb-[1%]">
              UNIQUE VENUES
            </p>
            <p className="font-fredoka font-black leading-none text-[18vw] tracking-tight">
              {stats.uniqueVenues}
            </p>
          </div>
        </div>

        {/* Right Column - Map */}
        <div className="w-[42%] flex flex-col items-center pt-[2%]">
          <p className="font-fredoka text-[2.8vw] font-bold tracking-wider text-white/80 mb-[4%] text-center">
            YOU PERFORMED IN...
          </p>
          <div className="w-full aspect-square">
            <NYCBoroughMap 
              visitedBoroughs={stats.uniqueBoroughs} 
              className="w-full h-full"
            />
          </div>
          <p className="font-fredoka text-[4.5vw] font-bold text-center mt-[4%] tracking-wide">
            {boroughText}
          </p>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="px-[5%] pb-[5%]">
        {/* Good Job */}
        <div className="text-right mb-[3%]">
          <p 
            className="font-fredoka font-black tracking-tight text-[10vw] leading-none inline-block"
            style={{ 
              WebkitTextStroke: '0.3vw #ffffff',
              color: 'transparent'
            }}
          >
            GOOD JOB!
          </p>
        </div>

        {/* Footer URL */}
        <div className="text-right">
          <p className="font-fredoka text-[3vw] font-bold tracking-wider text-white/60">
            COMEDIQ.COM/WRAPPED
          </p>
        </div>
      </div>
    </div>
  );
};

export default WrappedShareCard;
