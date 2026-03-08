import React, { useEffect, useRef, useState } from 'react';
import { OpenMic } from '@/types/openMic';
import { formatTime, formatCost, formatStageTime, formatDistance, calculateDistance, getMicLiveStatus } from './MapUtils';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
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

  const glowColor =
    liveStatus === 'live' || liveStatus === 'soon'
      ? 'border-green-500 shadow-green-500/20'
      : liveStatus === 'today'
      ? 'border-orange-500 shadow-orange-500/20'
      : 'border-slate-600 shadow-slate-600/10';

  return (
    <div
      className={`absolute bottom-0 left-0 right-0 z-20 bg-slate-900/95 backdrop-blur-xl border-t-2 ${glowColor} rounded-t-2xl shadow-2xl transition-all duration-300 ease-out ${
        expanded ? 'max-h-[60%]' : 'max-h-[35%]'
      }`}
    >
      {/* Drag handle */}
      <div
        className="flex justify-center pt-2 pb-1 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="w-10 h-1 rounded-full bg-slate-600" />
      </div>

      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-2 right-3 p-1.5 rounded-full hover:bg-slate-800 transition-colors"
      >
        <X className="w-4 h-4 text-slate-400" />
      </button>

      <div className="px-4 pb-4 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base text-slate-100 truncate">{mic.openMic}</h3>
              {(liveStatus === 'live' || liveStatus === 'soon') && (
                <span className="flex-shrink-0 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full bg-green-500/20 text-green-400 border border-green-500/40 animate-pulse">
                  {liveStatus === 'live' ? 'LIVE' : 'SOON'}
                </span>
              )}
            </div>
            <p className="text-sm text-slate-400 truncate">{mic.venueName}</p>
          </div>
        </div>

        {/* Info row – condensed */}
        <div className="flex items-center gap-3 mb-3 text-xs font-medium">
          <span className="text-cyan-400">{formatTime(mic.startTime)}</span>
          <span className="text-slate-500">|</span>
          <span className="text-slate-300">{formatCost(mic.cost)}</span>
          <span className="text-slate-500">|</span>
          <span className="text-slate-300">{formatStageTime(mic.stageTime)}min</span>
          {distanceStr && (
            <>
              <span className="text-slate-500">|</span>
              <span className="text-cyan-400">{distanceStr}</span>
            </>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            size="sm"
            className="flex-1 font-semibold bg-cyan-600 hover:bg-cyan-500 text-white"
            onClick={() => onViewDetails(mic)}
          >
            View Details
          </Button>
          {user && (
            <PlaylistSelectorDropdown micId={mic.uniqueIdentifier} />
          )}
        </div>

        {/* Expanded */}
        {expanded && (
          <div className="mt-3 pt-3 border-t border-slate-700 space-y-2 text-sm text-slate-400">
            {mic.neighborhood && (
              <p><span className="font-medium text-slate-300">Neighborhood:</span> {mic.neighborhood}, {mic.borough}</p>
            )}
            {mic.location && (
              <p><span className="font-medium text-slate-300">Address:</span> {mic.location}</p>
            )}
            {mic.signUpInstructions && (
              <p><span className="font-medium text-slate-300">Sign-up:</span> {mic.signUpInstructions}</p>
            )}
            {mic.hosts && (
              <p><span className="font-medium text-slate-300">Host:</span> {mic.hosts}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MapBottomSheet;
