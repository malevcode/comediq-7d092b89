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
          <div className="w-3 h-3 bg-green-500 border border-green-600 rounded-full"></div>
          <span>Verified</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <div className="w-3 h-3 bg-amber-500 border border-amber-600 rounded-full"></div>
          <span>Trial</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <div className="w-3 h-3 bg-gray-400 border border-gray-500 rounded-full"></div>
          <span>Legacy / Unverified</span>
        </div>
      </div>
      
      <h4 className="text-xs font-semibold mt-3 mb-2">Clusters</h4>
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-xs">
          <div className="w-4 h-4 bg-[#51bbd6] rounded-full flex items-center justify-center text-[8px] font-bold text-white">3</div>
          <span>Click to expand / zoom</span>
        </div>
      </div>
    </div>
  );
};
