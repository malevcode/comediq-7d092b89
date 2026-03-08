import React from 'react';

interface MapControlsProps {
  onRecenter: () => void;
  locationLoading: boolean;
  isLoading?: boolean;
  geocodingProgress?: { current: number; total: number } | null;
  error?: string | null;
  onDismissError?: () => void;
  loadedMicCount?: number;
  backgroundLoading?: boolean;
}

export const MapControls: React.FC<MapControlsProps> = ({
  onRecenter,
  locationLoading,
  isLoading,
  geocodingProgress,
  error,
  onDismissError,
  loadedMicCount,
  backgroundLoading
}) => {
  return (
    <>
      {/* Recenter button – dark theme */}
      <div className="absolute top-2 left-2 z-10">
        <button 
          onClick={onRecenter}
          disabled={locationLoading}
          className="bg-slate-800/90 hover:bg-slate-700 disabled:bg-slate-800/50 text-cyan-400 px-3 py-2 rounded-lg shadow-lg text-sm font-medium transition-colors duration-200 backdrop-blur-sm border border-slate-700/50"
        >
          {locationLoading ? 'Getting Location...' : '📍 Recenter'}
        </button>
      </div>
      
      {/* Geocoding progress */}
      {geocodingProgress && (
        <div className="absolute top-4 left-4 z-10 bg-slate-900/90 border border-cyan-500/30 p-3 rounded-lg shadow-lg max-w-xs backdrop-blur-sm">
          <div className="text-xs text-cyan-400 font-medium mb-1">Loading mics...</div>
          <div className="text-xs text-slate-400 mb-2">
            {geocodingProgress.current} / {geocodingProgress.total}
          </div>
          <div className="w-full bg-slate-700 rounded-full h-1.5">
            <div 
              className="bg-cyan-400 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${(geocodingProgress.current / geocodingProgress.total) * 100}%` }}
            />
          </div>
        </div>
      )}
      
      {/* Error */}
      {error && (
        <div className="absolute top-4 left-4 z-10 bg-red-950/90 border border-red-500/30 p-2 rounded-lg shadow-lg max-w-xs backdrop-blur-sm">
          <div className="text-xs text-red-400">{error}</div>
          {onDismissError && (
            <button onClick={onDismissError} className="text-xs text-red-500 underline mt-1">
              Dismiss
            </button>
          )}
        </div>
      )}

      {/* Mic count */}
      {loadedMicCount !== undefined && loadedMicCount > 0 && (
        <div className="absolute bottom-4 left-4 z-10 bg-slate-900/80 backdrop-blur-sm border border-slate-700/50 px-3 py-1.5 rounded-full">
          <div className="text-xs text-slate-400 font-medium">
            {loadedMicCount} mics
            {backgroundLoading && <span className="text-cyan-400 ml-1">loading...</span>}
          </div>
        </div>
      )}
    </>
  );
};
