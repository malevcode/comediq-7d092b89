import React from 'react';

interface MapLegendProps {
  className?: string;
}

export const MapLegend: React.FC<MapLegendProps> = ({ className = "" }) => {
  return (
    <div className={`bg-white p-3 rounded-lg shadow-lg mb-3 max-w-xs ${className} dark:bg-gray-800`}>
      <h4 className="text-xs font-semibold mb-2">Pin Status</h4>
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-xs">
          <img src="/map-pins/comediq_logo_pin.png" alt="" className="h-5 w-5 object-contain" />
          <span>Verified</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <img src="/map-pins/comediq_logo_pin.png" alt="" className="h-5 w-5 object-contain opacity-50" />
          <span>Unverified</span>
        </div>
      </div>
    </div>
  );
};
