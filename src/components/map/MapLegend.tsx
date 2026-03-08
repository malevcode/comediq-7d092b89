import React from 'react';

interface MapLegendProps {
  className?: string;
}

export const MapLegend: React.FC<MapLegendProps> = ({ className = "" }) => {
  return (
    <div className={`bg-slate-900/90 backdrop-blur-sm p-3 rounded-lg shadow-lg mb-3 max-w-xs border border-slate-700/50 ${className}`}>
      <h4 className="text-xs font-semibold mb-2 text-slate-300">Live Status</h4>
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-xs">
          <div className="w-3 h-3 bg-slate-900 border-2 border-green-500 rounded-full shadow-[0_0_6px_rgba(34,197,94,0.4)]" />
          <span className="text-slate-300">LIVE / Starting Soon</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <div className="w-3 h-3 bg-slate-900 border-2 border-orange-500 rounded-full shadow-[0_0_6px_rgba(249,115,22,0.4)]" />
          <span className="text-slate-300">Upcoming Today</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <div className="w-3 h-3 bg-slate-900 border-2 border-indigo-400 rounded-full shadow-[0_0_6px_rgba(129,140,248,0.4)]" />
          <span className="text-slate-300">Verified</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <div className="w-3 h-3 bg-slate-900 border-2 border-amber-400 rounded-full shadow-[0_0_6px_rgba(251,191,36,0.4)]" />
          <span className="text-slate-300">Trial</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <div className="w-3 h-3 bg-slate-900 border-2 border-gray-500 rounded-full" />
          <span className="text-slate-300">Legacy</span>
        </div>
      </div>

      <h4 className="text-xs font-semibold mt-3 mb-1 text-slate-300">Route</h4>
      <div className="flex items-center gap-2 text-xs">
        <div className="w-6 border-t-2 border-dashed border-cyan-400" />
        <span className="text-slate-300">Playlist route</span>
      </div>
    </div>
  );
};
