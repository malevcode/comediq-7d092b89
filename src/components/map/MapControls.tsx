import React from 'react';

interface MapControlsProps {
  onRecenter: () => void;
  onToggleFullscreen?: () => void;
  locationLoading: boolean;
  isFullscreen?: boolean;
  isLoading?: boolean;
  geocodingProgress?: { current: number; total: number } | null;
  error?: string | null;
  onDismissError?: () => void;
}

export const MapControls: React.FC<MapControlsProps> = ({
  onRecenter,
  onToggleFullscreen,
  locationLoading,
  isFullscreen,
  isLoading,
  geocodingProgress,
  error,
  onDismissError
}) => {
  return (
    <>
      {/* Map action buttons */}
      <div className="absolute bottom-10 right-2 z-10 flex flex-col gap-2">
        {onToggleFullscreen && (
          <button
            type="button"
            onClick={onToggleFullscreen}
            className="bg-white hover:bg-blue-50 text-slate-900 px-3 py-2 rounded-lg shadow-lg text-sm font-medium transition-colors duration-200 border border-blue-100"
          >
            {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          </button>
        )}
        <button 
          type="button"
          onClick={onRecenter}
          disabled={locationLoading}
          className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-3 py-2 rounded-lg shadow-lg text-sm font-medium transition-colors duration-200"
        >
          {locationLoading ? 'Getting Location...' : 'Recenter'}
        </button>
      </div>
      
      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute top-4 left-4 bg-white p-2 rounded-lg shadow-lg">
          <div className="text-xs text-gray-600">Loading area...</div>
        </div>
      )}
      
      {/* Geocoding progress indicator */}
      {geocodingProgress && (
        <div className="absolute top-4 left-4 bg-blue-50 border border-blue-200 p-3 rounded-lg shadow-lg max-w-xs">
          <div className="text-xs text-blue-800 font-medium mb-1">Loading mics in area...</div>
          <div className="text-xs text-blue-600 mb-2">
            {geocodingProgress.current} of {geocodingProgress.total} completed
          </div>
          <div className="w-full bg-blue-200 rounded-full h-1.5">
            <div 
              className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${(geocodingProgress.current / geocodingProgress.total) * 100}%` }}
            ></div>
          </div>
        </div>
      )}
      
      {/* Error indicator */}
      {error && (
        <div className="pointer-events-auto absolute top-4 left-4 z-30 max-w-xs rounded-lg border border-red-300 bg-red-100 p-2 shadow-lg">
          <div className="text-xs text-red-600">{error}</div>
          {onDismissError && (
            <button 
              type="button"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onDismissError();
              }}
              className="mt-1 rounded px-1 py-0.5 text-xs font-medium text-red-600 underline hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-400"
            >
              Dismiss
            </button>
          )}
        </div>
      )}

    </>
  );
}; 
