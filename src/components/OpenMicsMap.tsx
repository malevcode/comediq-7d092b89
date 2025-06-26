
import React, { useEffect, useRef, useState } from 'react';
import * as mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { OpenMic } from '@/types/openMic';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface OpenMicsMapProps {
  mics: OpenMic[];
  onMicSelect: (mic: OpenMic) => void;
}

const OpenMicsMap = ({ mics, onMicSelect }: OpenMicsMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapboxToken, setMapboxToken] = useState('');
  const [showTokenInput, setShowTokenInput] = useState(true);
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  // Borough color mapping matching the existing system
  const getBoroughColor = (borough: string) => {
    const cleanBorough = borough.trim();
    const colors = {
      Manhattan: "#06b6d4", // cyan-500
      Brooklyn: "#92400e", // amber-800  
      Queens: "#7c3aed", // purple-600
      Bronx: "#ea580c", // orange-600
      "Staten Island": "#6b7280" // gray-500
    };
    return colors[cleanBorough as keyof typeof colors] || "#6b7280";
  };

  // Get verification status color
  const getVerificationColor = (lastVerified: string) => {
    const verification = lastVerified?.toLowerCase() || '';
    
    if (verification.includes('tediously verified') || verification.includes('tedious')) {
      return "#fef3c7"; // yellow-100
    } else if (verification.includes('verified') || verification.includes('confirm')) {
      return "#d1fae5"; // emerald-100
    } else {
      return "#fee2e2"; // red-100
    }
  };

  // Format time for display
  const formatTime = (timeStr: string) => {
    return timeStr;
  };

  // Format cost for display
  const formatCost = (cost: string) => {
    if (cost.toLowerCase().includes('free')) return 'Free';
    const match = cost.match(/\$?(\d+)/);
    if (match) return `$${match[1]}`;
    return cost.length > 8 ? cost.substring(0, 8) + '...' : cost;
  };

  // Format stage time for display
  const formatStageTime = (stageTime: string) => {
    const match = stageTime.match(/(\d+)/);
    if (match) return match[1];
    return stageTime.replace(/\s*(minutes?|mins?)\s*/gi, '').trim().substring(0, 3);
  };

  // Get borough initial
  const getBoroughInitial = (borough: string) => {
    const cleanBorough = borough.trim();
    const initials = {
      Manhattan: "M",
      Brooklyn: "B", 
      Queens: "Q",
      Bronx: "X",
      "Staten Island": "S"
    };
    return initials[cleanBorough as keyof typeof initials] || "?";
  };

  const createMarkerElement = (mic: OpenMic) => {
    const el = document.createElement('div');
    el.className = 'custom-marker';
    el.style.cssText = `
      width: 40px;
      height: 50px;
      cursor: pointer;
      position: relative;
    `;

    const boroughColor = getBoroughColor(mic.borough);
    const verificationColor = getVerificationColor(mic.lastVerified);

    el.innerHTML = `
      <div style="
        width: 40px;
        height: 40px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        background-color: ${verificationColor};
        border: 3px solid ${boroughColor};
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
      ">
        <div style="
          transform: rotate(45deg);
          font-weight: bold;
          font-size: 12px;
          color: #374151;
          text-align: center;
          line-height: 1;
        ">
          ${getBoroughInitial(mic.borough)}
        </div>
      </div>
    `;

    el.addEventListener('click', () => onMicSelect(mic));

    return el;
  };

  const geocodeAddress = async (address: string): Promise<[number, number] | null> => {
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${mapboxToken}&limit=1`
      );
      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        return data.features[0].center;
      }
    } catch (error) {
      console.error('Geocoding error:', error);
    }
    return null;
  };

  const initializeMap = () => {
    if (!mapContainer.current || !mapboxToken) return;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [-73.935242, 40.730610], // NYC center
      zoom: 11,
      accessToken: mapboxToken
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
  };

  const updateMarkers = async () => {
    if (!map.current) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add new markers
    for (const mic of mics) {
      if (mic.location) {
        const coordinates = await geocodeAddress(mic.location);
        if (coordinates) {
          const markerElement = createMarkerElement(mic);
          
          const marker = new mapboxgl.Marker(markerElement)
            .setLngLat(coordinates)
            .addTo(map.current);

          // Add popup with mic info
          const popup = new mapboxgl.Popup({ offset: 25 })
            .setHTML(`
              <div style="padding: 8px; min-width: 200px;">
                <h3 style="font-weight: bold; margin: 0 0 4px 0; font-size: 14px;">${mic.openMic}</h3>
                <p style="margin: 0; font-size: 12px; color: #666;">${mic.venueName}</p>
                <p style="margin: 4px 0 0 0; font-size: 12px;">
                  <strong>${formatTime(mic.startTime)}</strong> • 
                  <span style="color: #059669;">${formatCost(mic.cost)}</span> • 
                  <span style="color: #d97706;">${formatStageTime(mic.stageTime)} min</span>
                </p>
              </div>
            `);

          marker.setPopup(popup);
          markersRef.current.push(marker);
        }
      }
    }
  };

  useEffect(() => {
    if (mapboxToken && !map.current) {
      initializeMap();
    }
  }, [mapboxToken]);

  useEffect(() => {
    if (map.current && mapboxToken) {
      updateMarkers();
    }
  }, [mics, mapboxToken]);

  if (showTokenInput) {
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
              value={mapboxToken}
              onChange={(e) => setMapboxToken(e.target.value)}
              className="text-sm"
            />
            <Button 
              onClick={() => setShowTokenInput(false)}
              disabled={!mapboxToken}
              className="bg-orange-500 hover:bg-orange-600"
            >
              Load Map
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-96 rounded-lg overflow-hidden border">
      <div ref={mapContainer} className="absolute inset-0" />
      
      {/* Map legend */}
      <div className="absolute top-4 left-4 bg-white p-3 rounded-lg shadow-lg max-w-xs">
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
    </div>
  );
};

export default OpenMicsMap;
