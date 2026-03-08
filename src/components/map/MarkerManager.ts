import maplibregl from 'maplibre-gl';
import { OpenMic } from '@/types/openMic';
import { getVerificationColor, formatTime, formatCost, formatStageTime, calculateDistance, formatDistance } from './MapUtils';

// Legacy MarkerManager - kept for reference, not actively used (ClusterManager is primary)
// All mapboxgl references updated to maplibregl for compatibility

export interface MarkerData {
  coordinates: [number, number];
  mic: OpenMic;
}

export class MarkerManager {
  private map: maplibregl.Map;
  private markers: maplibregl.Marker[] = [];
  private micData: OpenMic[] = [];
  private loadedMicIds: Set<string> = new Set();
  private userLocation: [number, number] | null = null;

  constructor(map: maplibregl.Map) {
    this.map = map;
  }

  public setMicData(mics: OpenMic[]): void {
    this.micData = mics;
  }

  public setUserLocation(location: [number, number] | null): void {
    this.userLocation = location;
  }

  // New method: Load markers for current viewport
  public async loadMarkersForViewport(micDataWithCoordinates: MarkerData[]): Promise<void> {
    // Wait for map to be fully loaded before adding layers
    if (!this.map.isStyleLoaded()) {
      await new Promise<void>((resolve) => {
        const checkStyleLoaded = () => {
          if (this.map.isStyleLoaded()) {
            resolve();
          } else {
            setTimeout(checkStyleLoaded, 100);
          }
        };
        checkStyleLoaded();
      });
    }

    // Add new markers that aren't already loaded
    for (const { coordinates, mic } of micDataWithCoordinates) {
      if (!this.loadedMicIds.has(mic.uniqueIdentifier)) {
        this.addIndividualMarker(coordinates, mic, (mic) => {
          this.onMicSelect?.(mic);
        });
        this.loadedMicIds.add(mic.uniqueIdentifier);
      }
    }
  }

  // Remove markers outside current viewport
  public removeMarkersOutsideViewport(bounds: maplibregl.LngLatBounds): void {
    this.markers = this.markers.filter(marker => {
      const markerLngLat = marker.getLngLat();
      const isInBounds = bounds.contains(markerLngLat);
      
      if (!isInBounds) {
        marker.remove();
        // Remove from loaded set if it's a mic marker (not user location)
        const markerElement = marker.getElement();
        if (markerElement.style.color !== '#ff4444') {
          // Find the mic ID and remove from loaded set
          // This is a bit hacky but we need to track which mics are loaded
          // We'll need to store mic IDs with markers in a future iteration
        }
      }
      
      return isInBounds;
    });
  }

  public addIndividualMarker(coordinates: [number, number], mic: OpenMic, onMicSelect: (mic: OpenMic) => void): void {
    // Calculate distance if user location is available
    let distanceText = '';
    if (this.userLocation) {
      const [userLng, userLat] = this.userLocation;
      const [micLng, micLat] = coordinates;
      const distanceMiles = calculateDistance(userLat, userLng, micLat, micLng);
      distanceText = formatDistance(distanceMiles);
    }

    const popup = new maplibregl.Popup({
      offset: 25,
      closeButton: false,
      closeOnClick: false
    }).setHTML(`
        <div class="p-2">
          <h3 class="font-bold text-lg">${mic.openMic}</h3>
          <p class="text-sm text-gray-600">${mic.venueName}</p>
          ${distanceText ? `<p class="text-sm text-blue-600 font-medium">📍 ${distanceText} away</p>` : ''}
          <p class="text-sm">
            ${formatTime(mic.startTime)} – ${formatTime(mic.latestEndTime)}
          </p>
          <p class="text-sm">${formatCost(mic.cost)}</p>
          <p class="text-sm">Stage time: ${formatStageTime(mic.stageTime)}</p>
        </div>
    `);

    const marker = new maplibregl.Marker({
      color: getVerificationColor(mic.lastVerified),
      scale: 0.8
    })
      .setLngLat(coordinates)
      .setPopup(popup)
      .addTo(this.map);

    // Mobile-friendly event handlers
    let isPopupVisible = false;
    let clickTimeout: NodeJS.Timeout | null = null;

    // Desktop: Show popup on hover
    marker.getElement().addEventListener('mouseenter', () => {
      if (!isPopupVisible) {
        popup.addTo(this.map);
        isPopupVisible = true;
      }
    });

    marker.getElement().addEventListener('mouseleave', () => {
      popup.remove();
      isPopupVisible = false;
    });

    // Mobile: Show popup on tap, open modal on long press
    marker.getElement().addEventListener('touchstart', (e) => {
      e.preventDefault();
      
      // Clear any existing timeout
      if (clickTimeout) {
        clearTimeout(clickTimeout);
      }
      
      // Show popup immediately on touch
      if (!isPopupVisible) {
        popup.addTo(this.map);
        isPopupVisible = true;
      }
      
      // Set timeout for long press to open modal
      clickTimeout = setTimeout(() => {
        popup.remove();
        isPopupVisible = false;
        onMicSelect(mic);
      }, 500); // 500ms for long press
    });

    marker.getElement().addEventListener('touchend', () => {
      // Clear the long press timeout on touch end
      if (clickTimeout) {
        clearTimeout(clickTimeout);
        clickTimeout = null;
      }
    });

    // Desktop: Click to open modal
    marker.getElement().addEventListener('click', (e) => {
      // Only handle click on desktop (not touch devices)
      // Touch events will be handled by touchstart/touchend
      if (!('ontouchstart' in window)) {
        popup.remove();
        isPopupVisible = false;
        onMicSelect(mic);
      }
    });

    this.markers.push(marker);
  }

  public addUserLocationMarker(coordinates: [number, number]): void {
    // Remove existing user markers
    this.markers.forEach(marker => {
      if (marker.getElement().style.color === '#ff4444') {
        console.log('Removing existing user location marker');
        marker.remove();
      }
    });
    
    // Add new user location marker
    const userMarker = new maplibregl.Marker({
      color: '#ff4444',
      scale: 0.8
    })
      .setLngLat(coordinates)
      .setPopup(new maplibregl.Popup().setHTML('<div>You are here</div>'))
      .addTo(this.map);
    
    this.markers.push(userMarker);
    console.log('User location marker added successfully:', coordinates);
  }

  public getCurrentViewportBounds(): mapboxgl.LngLatBounds {
    return this.map.getBounds();
  }

  public getLoadedMicCount(): number {
    return this.loadedMicIds.size;
  }

  public clearAllMarkers(): void {
    this.markers.forEach(marker => marker.remove());
    this.markers = [];
    this.loadedMicIds.clear();
  }

  // Callback for mic selection
  private onMicSelect?: (mic: OpenMic) => void;

  public setMicSelectCallback(callback: (mic: OpenMic) => void): void {
    this.onMicSelect = callback;
  }
} 