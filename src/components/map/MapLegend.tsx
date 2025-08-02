import React from 'react';

export const MapLegend: React.FC = () => {
  return (
    <div className="bg-white p-3 rounded-lg shadow-lg mb-3 max-w-xs">
      <h4 className="text-xs font-semibold mb-2">Pin Colors</h4>
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-xs">
          <div className="w-3 h-3 bg-yellow-100 border border-yellow-300 rounded-sm"></div>
          <span>Tediously Verified</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <div className="w-3 h-3 bg-emerald-100 border border-emerald-300 rounded-sm"></div>
          <span>Verified</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <div className="w-3 h-3 bg-red-100 border border-red-300 rounded-sm"></div>
          <span>Unverified</span>
        </div>
      </div>
      
      <h4 className="text-xs font-semibold mt-3 mb-2">Pin Borders</h4>
      <div className="grid grid-cols-2 gap-1 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-cyan-500 rounded-sm"></div>
          <span>Manhattan</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-amber-800 rounded-sm"></div>
          <span>Brooklyn</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-purple-600 rounded-sm"></div>
          <span>Queens</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-orange-600 rounded-sm"></div>
          <span>Bronx</span>
        </div>
        <div className="flex items-center gap-1 col-span-2">
          <div className="w-2 h-2 bg-gray-500 rounded-sm"></div>
          <span>Staten Island</span>
        </div>
      </div>
    </div>
  );
}; 