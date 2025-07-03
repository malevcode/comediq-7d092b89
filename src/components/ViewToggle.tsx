import React from 'react';
import { Button } from '@/components/ui/button';
import { Grid3x3, List, MapPin } from 'lucide-react';

interface ViewToggleProps {
  viewMode: 'list' | 'grid' | 'map';
  onViewChange: (mode: 'list' | 'grid' | 'map') => void;
}

const ViewToggle = ({ viewMode, onViewChange }: ViewToggleProps) => {
  return (
    <div className="w-full sm:w-auto overflow-x-hidden">
      <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg w-full sm:w-auto">
        <Button
          size="sm"
          onClick={() => onViewChange('list')}
          className={`h-8 px-3 text-xs hover:bg-sky ${
            viewMode === 'list' ? 'bg-sky text-white' : 'bg-gray-100 text-gray-600'
          }`}
        >
          <List className="h-3 w-3 mr-1" />
          List
        </Button>
        <Button
          size="sm"
          onClick={() => onViewChange('grid')}
          className={`h-8 px-3 text-xs hover:bg-sky ${
            viewMode === 'grid' ? 'bg-sky text-white' : 'bg-gray-100 text-gray-600'
          }`}
        >
          <Grid3x3 className="h-3 w-3 mr-1" />
          Grid
        </Button>
        {/* <Button
          size="sm"
          onClick={() => onViewChange('map')}
          className={`h-8 px-3 text-xs hover:bg-sky ${
            viewMode === 'map' ? 'bg-sky text-white' : 'bg-gray-100 text-gray-600'
          }`}
        >
        <MapPin className="h-3 w-3 mr-1" />
          Map
        </Button> */}
      </div>
    </div>
  );
};

export default ViewToggle;
