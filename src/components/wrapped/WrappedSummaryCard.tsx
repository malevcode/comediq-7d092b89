import { WrappedStats } from '@/hooks/useWrapped';
import { Mic, Clock, Building2, Sparkles } from 'lucide-react';

interface WrappedSummaryCardProps {
  stats: WrappedStats;
  stageName?: string;
  year?: number;
}

const WrappedSummaryCard = ({ stats, stageName, year = 2025 }: WrappedSummaryCardProps) => {
  const hours = Math.floor(stats.estimatedStageTime / 60);
  const minutes = stats.estimatedStageTime % 60;
  const timeDisplay = hours > 0 
    ? `${hours}h ${minutes}m` 
    : `${minutes} min`;

  return (
    <div 
      id="wrapped-summary-card"
      className="w-full max-w-[280px] mx-auto bg-gradient-to-br from-comediq-blue via-comediq-blue-dark to-[hsl(250,50%,25%)] rounded-3xl p-4 text-comediq-cream shadow-2xl border border-comediq-cream/10 flex flex-col overflow-hidden"
      style={{ aspectRatio: '9/16' }}
    >
      {/* Header */}
      <div className="text-center mb-3">
        <p className="text-comediq-cream/50 text-[9px] tracking-widest font-nunito mb-0.5">EST. 2025</p>
        <h2 className="font-fredoka text-xl font-bold tracking-tight">Comediq</h2>
        <p className="text-comediq-cream/80 text-[11px] font-fredoka font-medium">WRAPPED {year}</p>
      </div>

      {/* Name with highlight */}
      {stageName && (
        <div className="text-center mb-3">
          <span className="inline-block bg-comediq-cream/20 px-4 py-1 rounded-lg">
            <p className="font-fredoka text-base font-bold">{stageName}</p>
          </span>
        </div>
      )}

      {/* Main Stats - Large Feature */}
      <div className="bg-comediq-cream/10 backdrop-blur-sm rounded-xl p-3 text-center border border-comediq-cream/10 mb-2">
        <div className="bg-comediq-cream/20 w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-1.5">
          <Sparkles className="h-5 w-5" />
        </div>
        <p className="font-fredoka text-3xl font-bold leading-none">{stats.totalPerformances}</p>
        <p className="text-[10px] text-comediq-cream/70 font-nunito mt-0.5">Total Performances</p>
        <div className="flex justify-center gap-3 mt-1.5 text-[10px] text-comediq-cream/60">
          <span>{stats.totalMics} mics</span>
          <span>•</span>
          <span>{stats.totalShows} shows</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-1.5 mb-2">
        <div className="bg-comediq-cream/10 backdrop-blur-sm rounded-lg p-2 text-center border border-comediq-cream/10">
          <div className="bg-comediq-cream/20 w-6 h-6 rounded-full flex items-center justify-center mx-auto mb-0.5">
            <Clock className="h-3 w-3" />
          </div>
          <p className="font-fredoka text-lg font-bold leading-none">{timeDisplay}</p>
          <p className="text-[9px] text-comediq-cream/70 font-nunito mt-0.5">Stage Time</p>
        </div>

        <div className="bg-comediq-cream/10 backdrop-blur-sm rounded-lg p-2 text-center border border-comediq-cream/10">
          <div className="bg-comediq-cream/20 w-6 h-6 rounded-full flex items-center justify-center mx-auto mb-0.5">
            <Building2 className="h-3 w-3" />
          </div>
          <p className="font-fredoka text-lg font-bold leading-none">{stats.uniqueVenues}</p>
          <p className="text-[9px] text-comediq-cream/70 font-nunito mt-0.5">Venues</p>
        </div>
      </div>

      {/* Top Venue */}
      {stats.topVenue && (
        <div className="bg-comediq-cream/10 backdrop-blur-sm rounded-lg p-2 flex items-center gap-2 border border-comediq-cream/10 mb-2">
          <div className="bg-comediq-cream/20 rounded-full p-1">
            <Mic className="h-2.5 w-2.5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[9px] text-comediq-cream/60 font-nunito leading-none">Favorite Venue</p>
            <p className="font-fredoka font-bold text-[11px] truncate leading-tight">{stats.topVenue.name}</p>
          </div>
        </div>
      )}

      {/* Boroughs */}
      {stats.uniqueBoroughs.length > 0 && (
        <div className="flex flex-wrap justify-center gap-1 mb-2">
          {stats.uniqueBoroughs.slice(0, 4).map(borough => (
            <span
              key={borough}
              className="bg-comediq-cream/20 px-1.5 py-0.5 rounded-full text-[9px] font-fredoka font-medium"
            >
              {borough}
            </span>
          ))}
        </div>
      )}

      {/* Footer - pushed to bottom */}
      <div className="mt-auto pt-1.5 border-t border-comediq-cream/20 text-center">
        <p className="text-[9px] text-comediq-cream/50 font-nunito tracking-wide">comediq.us</p>
      </div>
    </div>
  );
};

export default WrappedSummaryCard;
