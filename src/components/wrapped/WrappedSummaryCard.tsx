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
      className="w-full max-w-[270px] mx-auto bg-gradient-to-br from-comediq-blue via-comediq-blue-dark to-[hsl(250,50%,25%)] rounded-3xl p-5 text-comediq-cream shadow-2xl border border-comediq-cream/10"
      style={{ aspectRatio: '9/16' }}
    >
      {/* Header */}
      <div className="text-center mb-4">
        <p className="text-comediq-cream/50 text-[10px] tracking-widest font-nunito mb-0.5">EST. 2025</p>
        <h2 className="font-fredoka text-2xl font-bold tracking-tight">COMEDIQ</h2>
        <p className="text-comediq-cream/80 text-xs font-fredoka font-medium">WRAPPED {year}</p>
      </div>

      {/* Name */}
      {stageName && (
        <div className="text-center mb-4">
          <p className="font-fredoka text-lg font-bold">{stageName}</p>
        </div>
      )}

      {/* Main Stats - Large Feature */}
      <div className="bg-comediq-cream/10 backdrop-blur-sm rounded-2xl p-4 text-center border border-comediq-cream/10 mb-3">
        <div className="bg-comediq-cream/20 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2">
          <Sparkles className="h-6 w-6" />
        </div>
        <p className="font-fredoka text-4xl font-bold">{stats.totalPerformances}</p>
        <p className="text-xs text-comediq-cream/70 font-nunito">Total Performances</p>
        <div className="flex justify-center gap-4 mt-2 text-xs text-comediq-cream/60">
          <span>{stats.totalMics} mics</span>
          <span>•</span>
          <span>{stats.totalShows} shows</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="bg-comediq-cream/10 backdrop-blur-sm rounded-xl p-3 text-center border border-comediq-cream/10">
          <div className="bg-comediq-cream/20 w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-1">
            <Clock className="h-4 w-4" />
          </div>
          <p className="font-fredoka text-xl font-bold">{timeDisplay}</p>
          <p className="text-[10px] text-comediq-cream/70 font-nunito">Stage Time</p>
        </div>

        <div className="bg-comediq-cream/10 backdrop-blur-sm rounded-xl p-3 text-center border border-comediq-cream/10">
          <div className="bg-comediq-cream/20 w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-1">
            <Building2 className="h-4 w-4" />
          </div>
          <p className="font-fredoka text-xl font-bold">{stats.uniqueVenues}</p>
          <p className="text-[10px] text-comediq-cream/70 font-nunito">Venues</p>
        </div>
      </div>

      {/* Top Venue */}
      {stats.topVenue && (
        <div className="bg-comediq-cream/10 backdrop-blur-sm rounded-xl p-2.5 flex items-center gap-2 border border-comediq-cream/10 mb-3">
          <div className="bg-comediq-cream/20 rounded-full p-1.5">
            <Mic className="h-3 w-3" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] text-comediq-cream/60 font-nunito">Favorite Venue</p>
            <p className="font-fredoka font-bold text-xs truncate">{stats.topVenue.name}</p>
          </div>
        </div>
      )}

      {/* Boroughs */}
      {stats.uniqueBoroughs.length > 0 && (
        <div className="flex flex-wrap justify-center gap-1 mb-3">
          {stats.uniqueBoroughs.slice(0, 5).map(borough => (
            <span
              key={borough}
              className="bg-comediq-cream/20 px-2 py-0.5 rounded-full text-[10px] font-fredoka font-medium"
            >
              {borough}
            </span>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="mt-auto pt-2 border-t border-comediq-cream/20 text-center">
        <p className="text-[10px] text-comediq-cream/50 font-nunito tracking-wide">comediq.us</p>
      </div>
    </div>
  );
};

export default WrappedSummaryCard;
