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
      {/* Recenter button */}
      <div className="absolute top-4 right-4">
        <button 
          onClick={onRecenter}
          disabled={locationLoading}
          className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-4 py-2 rounded-lg shadow-lg text-sm font-medium transition-colors duration-200"
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
        <div className="absolute top-4 left-4 bg-red-100 border border-red-300 p-2 rounded-lg shadow-lg max-w-xs">
          <div className="text-xs text-red-600">{error}</div>
          {onDismissError && (
            <button 
              onClick={onDismissError}
              className="text-xs text-red-500 underline mt-1"
            >
              Dismiss
            </button>
          )}
        </div>
      )}

      {/* Loaded mic count indicator */}
      {loadedMicCount !== undefined && (
        <div className="absolute bottom-4 left-4 bg-white p-2 rounded-lg shadow-lg">
          <div className="text-xs text-gray-600">
            {loadedMicCount} mics loaded
            {backgroundLoading && (
              <div className="text-xs text-blue-600 mt-1">
                Loading more...
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}; 