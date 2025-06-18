
import React from 'react';
import { Button } from '@/components/ui/button';
import { Grid3x3, MapPin } from 'lucide-react';

interface ViewToggleProps {
  viewMode: 'list' | 'map';
  onViewChange: (mode: 'list' | 'map') => void;
}

const ViewToggle = ({ viewMode, onViewChange }: ViewToggleProps) => {
  return (
    <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
      <Button
        variant={viewMode === 'list' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onViewChange('list')}
        className="h-8 px-3 text-xs"
      >
        <Grid3x3 className="h-3 w-3 mr-1" />
        List
      </Button>
      <Button
        variant={viewMode === 'map' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onViewChange('map')}
        className="h-8 px-3 text-xs"
      >
        <MapPin className="h-3 w-3 mr-1" />
        Map
      </Button>
    </div>
  );
};

export default ViewToggle;
