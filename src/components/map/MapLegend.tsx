import React from 'react';

interface MapLegendProps {
  className?: string;
}

export const MapLegend: React.FC<MapLegendProps> = ({ className = "" }) => {
  return (
    <div className={`bg-white p-3 rounded-lg shadow-lg mb-3 max-w-xs ${className}`}>
      <h4 className="text-xs font-semibold mb-2">Pin Status</h4>
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-xs">
          <img src="/map-pins/pin-verified.png" alt="" className="h-5 w-5 object-contain" />
          <span>Verified recently</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <img src="/map-pins/pin-warning.png" alt="" className="h-5 w-5 object-contain" />
          <span>Needs reconfirming</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <img src="/map-pins/pin-error.png" alt="" className="h-5 w-5 object-contain" />
          <span>Unverified</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <img src="/map-pins/pin-finished.png" alt="" className="h-5 w-5 object-contain" />
          <span>Already happened today</span>
        </div>
      </div>
    </div>
  );
}; 
