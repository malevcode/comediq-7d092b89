import { WrappedStats } from '@/hooks/useWrapped';
import { Mic, MapPin, Clock, Calendar, Heart, Building2 } from 'lucide-react';

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
      className="w-full max-w-sm mx-auto bg-gradient-to-br from-comediq-blue via-comediq-blue-dark to-[hsl(250,50%,25%)] rounded-3xl p-6 text-comediq-cream shadow-2xl border border-comediq-cream/10"
    >
      {/* Header */}
      <div className="text-center mb-6">
        <p className="text-comediq-cream/50 text-xs tracking-widest font-nunito mb-1">EST. 2025</p>
        <h2 className="font-fredoka text-3xl font-bold tracking-tight">COMEDIQ</h2>
        <p className="text-comediq-cream/80 text-sm font-fredoka font-medium">WRAPPED {year}</p>
      </div>

      {/* Name */}
      {stageName && (
        <div className="text-center mb-6">
          <p className="font-fredoka text-xl font-bold">{stageName}</p>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-comediq-cream/10 backdrop-blur-sm rounded-2xl p-4 text-center border border-comediq-cream/10">
          <div className="bg-comediq-cream/20 w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2">
            <Mic className="h-5 w-5" />
          </div>
          <p className="font-fredoka text-3xl font-bold">{stats.totalMics}</p>
          <p className="text-xs text-comediq-cream/70 font-nunito">Open Mics</p>
        </div>

        <div className="bg-comediq-cream/10 backdrop-blur-sm rounded-2xl p-4 text-center border border-comediq-cream/10">
          <div className="bg-comediq-cream/20 w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2">
            <Clock className="h-5 w-5" />
          </div>
          <p className="font-fredoka text-3xl font-bold">{timeDisplay}</p>
          <p className="text-xs text-comediq-cream/70 font-nunito">Stage Time</p>
        </div>

        <div className="bg-comediq-cream/10 backdrop-blur-sm rounded-2xl p-4 text-center border border-comediq-cream/10">
          <div className="bg-comediq-cream/20 w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2">
            <Building2 className="h-5 w-5" />
          </div>
          <p className="font-fredoka text-3xl font-bold">{stats.uniqueVenues}</p>
          <p className="text-xs text-comediq-cream/70 font-nunito">Venues</p>
        </div>

        <div className="bg-comediq-cream/10 backdrop-blur-sm rounded-2xl p-4 text-center border border-comediq-cream/10">
          <div className="bg-comediq-cream/20 w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2">
            <MapPin className="h-5 w-5" />
          </div>
          <p className="font-fredoka text-3xl font-bold">{stats.uniqueBoroughs.length}</p>
          <p className="text-xs text-comediq-cream/70 font-nunito">Boroughs</p>
        </div>
      </div>

      {/* Highlights */}
      <div className="space-y-3">
        {stats.topVenue && (
          <div className="bg-comediq-cream/10 backdrop-blur-sm rounded-xl p-3 flex items-center gap-3 border border-comediq-cream/10">
            <div className="bg-comediq-cream/20 rounded-full p-2">
              <Heart className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-comediq-cream/60 font-nunito">Top Venue</p>
              <p className="font-fredoka font-bold text-sm truncate">{stats.topVenue.name}</p>
            </div>
          </div>
        )}

        {stats.favoriteDay && (
          <div className="bg-comediq-cream/10 backdrop-blur-sm rounded-xl p-3 flex items-center gap-3 border border-comediq-cream/10">
            <div className="bg-comediq-cream/20 rounded-full p-2">
              <Calendar className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs text-comediq-cream/60 font-nunito">Favorite Day</p>
              <p className="font-fredoka font-bold text-sm">{stats.favoriteDay}</p>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-6 pt-4 border-t border-comediq-cream/20 text-center">
        <p className="text-xs text-comediq-cream/50 font-nunito tracking-wide">comediq.us</p>
      </div>
    </div>
  );
};

export default WrappedSummaryCard;
