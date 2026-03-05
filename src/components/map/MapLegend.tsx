import React from 'react';

interface MapLegendProps {
  className?: string;
}

export const MapLegend: React.FC<MapLegendProps> = ({ className = "" }) => {
  return (
    <div className={`bg-background p-3 rounded-lg shadow-lg mb-3 max-w-xs ${className}`}>
      <h4 className="text-xs font-semibold mb-2 text-foreground">Live Status</h4>
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-xs">
          <div className="w-3 h-3 bg-green-500 border border-green-600 rounded-full"></div>
          <span className="text-foreground">LIVE / Starting Soon</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <div className="w-3 h-3 bg-[#1a1a2e] border border-gray-700 rounded-full"></div>
          <span className="text-foreground">Upcoming Today</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <div className="w-3 h-3 bg-indigo-500 border border-indigo-600 rounded-full"></div>
          <span className="text-foreground">Verified</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <div className="w-3 h-3 bg-amber-500 border border-amber-600 rounded-full"></div>
          <span className="text-foreground">Trial</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <div className="w-3 h-3 bg-gray-400 border border-gray-500 rounded-full"></div>
          <span className="text-foreground">Legacy</span>
        </div>
      </div>

      <h4 className="text-xs font-semibold mt-3 mb-2 text-foreground">Clusters</h4>
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-xs">
          <div className="w-4 h-4 bg-[#51bbd6] rounded-full flex items-center justify-center text-[8px] font-bold text-white">3</div>
          <span className="text-foreground">Click to expand / zoom</span>
        </div>
      </div>

      <h4 className="text-xs font-semibold mt-3 mb-1 text-foreground">Route</h4>
      <div className="flex items-center gap-2 text-xs">
        <div className="w-6 border-t-2 border-dashed border-primary"></div>
        <span className="text-foreground">Playlist route</span>
      </div>
    </div>
  );
};