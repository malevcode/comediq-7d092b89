import React, { useEffect, useRef, useState } from 'react';
import { OpenMic } from '@/types/openMic';
import { formatTime, formatCost, formatStageTime, formatDistance, calculateDistance, getMicLiveStatus } from './MapUtils';
import { X, MapPin, Clock, DollarSign, Mic, ChevronUp, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PlaylistSelectorDropdown from '@/components/mic/PlaylistSelectorDropdown';
import { useAuth } from '@/contexts/AuthContext';

interface MapBottomSheetProps {
  mic: OpenMic | null;
  userLocation: [number, number] | null;
  micCoords: [number, number] | null;
  onClose: () => void;
  onViewDetails: (mic: OpenMic) => void;
}

const MapBottomSheet: React.FC<MapBottomSheetProps> = ({
  mic,
  userLocation,
  micCoords,
  onClose,
  onViewDetails,
}) => {
  const { user } = useAuth();
  const [expanded, setExpanded] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);

  // Reset expansion when mic changes
  useEffect(() => {
    setExpanded(false);
  }, [mic?.uniqueIdentifier]);

  if (!mic) return null;

  const liveStatus = getMicLiveStatus(mic.day, mic.startTime, mic.latestEndTime);

  let distanceStr: string | null = null;
  if (userLocation && micCoords) {
    const dist = calculateDistance(userLocation[1], userLocation[0], micCoords[1], micCoords[0]);
    distanceStr = formatDistance(dist);
  }

  const statusColor =
    liveStatus === 'live' || liveStatus === 'soon'
      ? 'bg-green-500'
      : liveStatus === 'today'
      ? 'bg-foreground'
      : mic.status === 'verified'
      ? 'bg-green-500'
      : mic.status === 'trial'
      ? 'bg-amber-500'
      : 'bg-muted-foreground';

  return (
    <div
      ref={sheetRef}
      className={`absolute bottom-0 left-0 right-0 z-20 bg-background border-t border-border rounded-t-2xl shadow-2xl transition-all duration-300 ease-out ${
        expanded ? 'max-h-[60%]' : 'max-h-[35%]'
      }`}
    >
      {/* Drag handle */}
      <div
        className="flex justify-center pt-2 pb-1 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
      </div>

      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-2 right-3 p-1.5 rounded-full hover:bg-muted transition-colors"
      >
        <X className="w-4 h-4 text-muted-foreground" />
      </button>

      <div className="px-4 pb-4 overflow-y-auto">
        {/* Header row: Status + Name */}
        <div className="flex items-start gap-3 mb-3">
          <div className={`w-3 h-3 rounded-full mt-1.5 flex-shrink-0 ${statusColor}`} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base text-foreground truncate">{mic.openMic}</h3>
              {(liveStatus === 'live' || liveStatus === 'soon') && (
                <span className="flex-shrink-0 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full bg-green-500 text-white animate-pulse">
                  {liveStatus === 'live' ? 'LIVE' : 'SOON'}
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground truncate">{mic.venueName}</p>
          </div>
        </div>

        {/* Info chips */}
        <div className="flex flex-wrap gap-2 mb-3">
          {distanceStr && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
              <MapPin className="w-3 h-3" />
              {distanceStr}
            </div>
          )}
          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-muted text-foreground text-xs font-medium">
            <Clock className="w-3 h-3" />
            {formatTime(mic.startTime)}
          </div>
          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-muted text-foreground text-xs font-medium">
            <DollarSign className="w-3 h-3" />
            {formatCost(mic.cost)}
          </div>
          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-muted text-foreground text-xs font-medium">
            <Mic className="w-3 h-3" />
            {formatStageTime(mic.stageTime)} min
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <Button
            variant="default"
            size="sm"
            className="flex-1 font-semibold"
            onClick={() => onViewDetails(mic)}
          >
            View Details
          </Button>
          {user && (
            <PlaylistSelectorDropdown micUniqueIdentifier={mic.uniqueIdentifier} micName={mic.openMic} open={false} onOpenChange={() => {}} />
          )}
        </div>

        {/* Expanded content */}
        {expanded && (
          <div className="mt-3 pt-3 border-t border-border space-y-2 text-sm text-muted-foreground">
            {mic.neighborhood && (
              <p><span className="font-medium text-foreground">Neighborhood:</span> {mic.neighborhood}, {mic.borough}</p>
            )}
            {mic.location && (
              <p><span className="font-medium text-foreground">Address:</span> {mic.location}</p>
            )}
            {mic.signUpInstructions && (
              <p><span className="font-medium text-foreground">Sign-up:</span> {mic.signUpInstructions}</p>
            )}
            {mic.hosts && (
              <p><span className="font-medium text-foreground">Host:</span> {mic.hosts}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MapBottomSheet;