import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface TokenInputProps {
  token: string;
  onTokenChange: (token: string) => void;
  onSubmit: () => void;
}

export const TokenInput: React.FC<TokenInputProps> = ({
  token,
  onTokenChange,
  onSubmit
}) => {
  return (
    <div className="flex flex-col items-center justify-center h-96 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
      <div className="text-center max-w-md mx-auto p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Mapbox Token Required</h3>
        <p className="text-sm text-gray-600 mb-4">
          To view the map, please enter your Mapbox public token. You can get one free at{' '}
          <a href="https://mapbox.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
            mapbox.com
          </a>
        </p>
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="pk.eyJ1IjoiLi4u"
            value={token}
            onChange={(e) => onTokenChange(e.target.value)}
            className="text-sm"
            aria-label="Mapbox access token"
          />
          <Button 
            onClick={onSubmit}
            disabled={!token}
            className="bg-orange-500 hover:bg-orange-600"
          >
            Load Map
          </Button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          For production, set VITE_MAPBOX_TOKEN in your environment variables
        </p>
      </div>
    </div>
  );
}; 