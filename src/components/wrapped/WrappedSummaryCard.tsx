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
      className="w-full max-w-sm mx-auto bg-gradient-to-br from-orange-500 via-pink-500 to-cyan-500 rounded-3xl p-6 text-white shadow-2xl"
    >
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-black tracking-tight">COMEDIQ</h2>
        <p className="text-white/80 text-sm font-medium">WRAPPED {year}</p>
      </div>

      {/* Name */}
      {stageName && (
        <div className="text-center mb-6">
          <p className="text-xl font-bold">{stageName}</p>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 text-center">
          <Mic className="h-6 w-6 mx-auto mb-2" />
          <p className="text-3xl font-black">{stats.totalMics}</p>
          <p className="text-xs text-white/80">Open Mics</p>
        </div>

        <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 text-center">
          <Clock className="h-6 w-6 mx-auto mb-2" />
          <p className="text-3xl font-black">{timeDisplay}</p>
          <p className="text-xs text-white/80">Stage Time</p>
        </div>

        <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 text-center">
          <Building2 className="h-6 w-6 mx-auto mb-2" />
          <p className="text-3xl font-black">{stats.uniqueVenues}</p>
          <p className="text-xs text-white/80">Venues</p>
        </div>

        <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 text-center">
          <MapPin className="h-6 w-6 mx-auto mb-2" />
          <p className="text-3xl font-black">{stats.uniqueBoroughs.length}</p>
          <p className="text-xs text-white/80">Boroughs</p>
        </div>
      </div>

      {/* Highlights */}
      <div className="space-y-3">
        {stats.topVenue && (
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 flex items-center gap-3">
            <div className="bg-white/20 rounded-full p-2">
              <Heart className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs text-white/70">Top Venue</p>
              <p className="font-bold text-sm truncate">{stats.topVenue.name}</p>
            </div>
          </div>
        )}

        {stats.favoriteDay && (
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 flex items-center gap-3">
            <div className="bg-white/20 rounded-full p-2">
              <Calendar className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs text-white/70">Favorite Day</p>
              <p className="font-bold text-sm">{stats.favoriteDay}</p>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-6 pt-4 border-t border-white/20 text-center">
        <p className="text-xs text-white/60">comediq.us</p>
      </div>
    </div>
  );
};

export default WrappedSummaryCard;
