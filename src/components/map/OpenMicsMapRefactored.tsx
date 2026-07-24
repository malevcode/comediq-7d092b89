import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Info } from 'lucide-react';
import { OpenMic } from '@/types/openMic';
import { LocationService } from './LocationService';
import { MapControls } from './MapControls';
import { MapLegend } from './MapLegend';
import { getMapboxToken } from './MapInitializer';
import { formatCost, formatStageTime, formatTime } from './MapUtils';

interface OpenMicsMapProps {
  mics: OpenMic[];
  onMicSelect: (mic: OpenMic) => void;
}

type MicPinStatus = 'verified' | 'warning' | 'error' | 'finished';
type MicFeatureProperties = {
  micId: string;
  dotIcon: string;
  pinIcon: string;
  pinLabel: string;
  timeLabel: string;
  timePeriod: string;
};
type MappedMic = { mic: OpenMic; latitude: number; longitude: number };

const RECENT_VERIFICATION_DAYS = 60;
const LONG_UNVERIFIED_DAYS = 120;
const MINUTES_PER_DAY = 24 * 60;
const NYC_CENTER: [number, number] = [-73.935242, 40.73061];
const PIN_IMAGE_IDS: MicPinStatus[] = ['verified', 'warning', 'error', 'finished'];
const PIN_ZOOM_THRESHOLD = 12.5;
const EMPTY_FEATURE_COLLECTION: GeoJSON.FeatureCollection<GeoJSON.Point, MicFeatureProperties> = {
  type: 'FeatureCollection',
  features: [],
};
const COORDINATE_GROUP_PRECISION = 5;

function parseCoordinate(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function parseLastVerifiedDate(value: unknown, currentYear = new Date().getFullYear()): Date | null {
  if (typeof value !== 'string') return null;

  const normalizedValue = value.trim();
  if (!normalizedValue || /unverified/i.test(normalizedValue)) return null;

  const isoMatch = normalizedValue.match(/\d{4}-\d{2}-\d{2}(?:t[^\s]+)?/i);
  if (isoMatch) {
    const parsed = new Date(isoMatch[0]);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const dateMatch = normalizedValue.match(/(\d{1,2})[/.](\d{1,2})(?:[/.](\d{2,4}))?/);
  if (!dateMatch) return null;

  const month = Number(dateMatch[1]);
  const day = Number(dateMatch[2]);
  const rawYear = dateMatch[3] ? Number(dateMatch[3]) : currentYear;
  const year = rawYear < 100 ? 2000 + rawYear : rawYear;
  const parsed = new Date(year, month - 1, day);

  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function getDaysSince(date: Date, now = new Date()): number {
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  return Math.floor((startOfToday - startOfDate) / (MINUTES_PER_DAY * 60 * 1000));
}

function getMicPinStatus(mic: OpenMic): MicPinStatus {
  if (hasMicAlreadyHappenedToday(mic)) {
    return 'finished';
  }

  const status = mic.status?.toLowerCase();
  const lastVerified = parseLastVerifiedDate(mic.lastVerified);
  const daysSinceVerified = lastVerified ? getDaysSince(lastVerified) : null;

  if (status === 'verified' && daysSinceVerified !== null && daysSinceVerified <= RECENT_VERIFICATION_DAYS) {
    return 'verified';
  }

  if (daysSinceVerified !== null && daysSinceVerified <= LONG_UNVERIFIED_DAYS) {
    return 'warning';
  }

  return 'error';
}

function getMicWeekdayIndex(mic: OpenMic): number | null {
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const index = daysOfWeek.findIndex((day) => day.toLowerCase() === mic.day?.trim().toLowerCase());
  return index === -1 ? null : index;
}

function parseMicStartMinutes(mic: OpenMic): number | null {
  const rawTime = mic.startTime;
  if (!rawTime) return null;

  const match = rawTime.trim().toLowerCase().match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/);
  if (!match) return null;

  const rawHour = Number(match[1]);
  const minutes = Number(match[2] ?? 0);
  const period = match[3];

  if (!Number.isFinite(rawHour) || !Number.isFinite(minutes)) return null;

  let hour = rawHour;
  if (period === 'pm' && hour < 12) {
    hour += 12;
  } else if (period === 'am' && hour === 12) {
    hour = 0;
  }

  return hour * 60 + minutes;
}

function hasMicAlreadyHappenedToday(mic: OpenMic, date = new Date()): boolean {
  if (getMicWeekdayIndex(mic) !== date.getDay()) return false;

  const startMinutes = parseMicStartMinutes(mic);
  if (startMinutes === null) return false;

  return startMinutes < date.getHours() * 60 + date.getMinutes();
}

function getCoordinateGroupKey({ latitude, longitude }: MappedMic): string {
  return `${latitude.toFixed(COORDINATE_GROUP_PRECISION)}:${longitude.toFixed(COORDINATE_GROUP_PRECISION)}`;
}

function getMicPinSortMinutes(mic: OpenMic): number {
  return parseMicStartMinutes(mic) ?? Number.MAX_SAFE_INTEGER;
}

function getRepresentativeMappedMic(mics: MappedMic[]): MappedMic {
  const [representativeMic] = [...mics].sort((a, b) => {
    const aIsFinished = hasMicAlreadyHappenedToday(a.mic);
    const bIsFinished = hasMicAlreadyHappenedToday(b.mic);

    if (aIsFinished !== bIsFinished) {
      return aIsFinished ? 1 : -1;
    }

    return getMicPinSortMinutes(a.mic) - getMicPinSortMinutes(b.mic);
  });

  return representativeMic ?? mics[0];
}

function getRepresentativeMappedMics(mics: MappedMic[]): MappedMic[] {
  const groupsByCoordinate = new Map<string, MappedMic[]>();

  mics.forEach((mappedMic) => {
    const key = getCoordinateGroupKey(mappedMic);
    const groupedMics = groupsByCoordinate.get(key);

    if (groupedMics) {
      groupedMics.push(mappedMic);
    } else {
      groupsByCoordinate.set(key, [mappedMic]);
    }
  });

  return Array.from(groupsByCoordinate.values()).map(getRepresentativeMappedMic);
}

function getPinLabel(timeStr: string): string {
  const { value, period } = getPinTimeParts(timeStr);
  return period ? `${value}\n${period}` : value;
}

function getPinTimeParts(timeStr: string): { value: string; period: string } {
  const formatted = formatTime(timeStr).trim();
  const match = formatted.match(/^(.+?)\s*(AM|PM)$/i);
  if (!match) return { value: formatted || 'OPEN', period: '' };
  return { value: match[1].trim(), period: match[2].toUpperCase() };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function buildPopupHtml(mic: OpenMic): string {
  return `
    <div style="min-width:180px;padding:8px;font-size:13px;color:#0f172a;">
      <div style="font-weight:800;font-size:15px;margin-bottom:3px;">${escapeHtml(mic.openMic)}</div>
      <div style="color:#475569;margin-bottom:6px;">${escapeHtml(mic.venueName)}</div>
      <div>${escapeHtml(formatTime(mic.startTime))} - ${escapeHtml(formatTime(mic.latestEndTime))}</div>
      <div>${escapeHtml(formatCost(mic.cost))}</div>
      <div>Stage time: ${escapeHtml(formatStageTime(mic.stageTime))}</div>
    </div>
  `;
}

function loadMapImage(map: mapboxgl.Map, id: string, url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (map.hasImage(id)) {
      resolve();
      return;
    }

    map.loadImage(url, (error, image) => {
      if (error || !image) {
        reject(error ?? new Error(`Unable to load ${url}`));
        return;
      }

      if (!map.hasImage(id)) {
        map.addImage(id, image);
      }
      resolve();
    });
  });
}

function getSource(map: mapboxgl.Map): mapboxgl.GeoJSONSource | undefined {
  return map.getSource('open-mics') as mapboxgl.GeoJSONSource | undefined;
}

function getMappedMicsViewportKey(mics: MappedMic[]): string {
  return mics
    .map(({ mic, latitude, longitude }) => `${mic.uniqueIdentifier}:${latitude.toFixed(5)}:${longitude.toFixed(5)}`)
    .join('|');
}

function fitMapToMappedMics(map: mapboxgl.Map, mics: MappedMic[]) {
  if (mics.length === 0) return;

  if (mics.length === 1) {
    const [{ latitude, longitude }] = mics;
    map.easeTo({
      center: [longitude, latitude],
      zoom: Math.max(map.getZoom(), 14),
      duration: 700,
    });
    return;
  }

  const bounds = new mapboxgl.LngLatBounds();
  mics.forEach(({ latitude, longitude }) => bounds.extend([longitude, latitude]));

  map.fitBounds(bounds, {
    padding: { top: 56, right: 56, bottom: 56, left: 56 },
    maxZoom: 13.4,
    duration: 700,
  });
}

const OpenMicsMapRefactored = ({ mics, onMicSelect }: OpenMicsMapProps) => {
  const mapShellRef = useRef<HTMLDivElement | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const popupRef = useRef<mapboxgl.Popup | null>(null);
  const userLocationMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const hasRequestedLocationRef = useRef(false);
  const lastViewportKeyRef = useRef('');
  const micLookupRef = useRef(new Map<string, OpenMic>());
  const onMicSelectRef = useRef(onMicSelect);

  const [error, setError] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    onMicSelectRef.current = onMicSelect;
  }, [onMicSelect]);

  const mappedMics = useMemo(
    () =>
      mics.flatMap((mic) => {
        const latitude = parseCoordinate(mic.latitude);
        const longitude = parseCoordinate(mic.longitude);
        if (latitude === null || longitude === null) return [];
        return [{ mic, latitude, longitude }];
      }),
    [mics],
  );

  const representativeMappedMics = useMemo(() => getRepresentativeMappedMics(mappedMics), [mappedMics]);

  const micGeoJson = useMemo<GeoJSON.FeatureCollection<GeoJSON.Point, MicFeatureProperties>>(
    () => ({
      type: 'FeatureCollection',
      features: representativeMappedMics.map(({ mic, latitude, longitude }) => {
        const pinStatus = getMicPinStatus(mic);
        const timeParts = getPinTimeParts(mic.startTime);
        return {
          type: 'Feature',
          id: mic.uniqueIdentifier,
          properties: {
            micId: mic.uniqueIdentifier,
            dotIcon: `mic-dot-${pinStatus}`,
            pinIcon: `mic-pin-${pinStatus}`,
            pinLabel: getPinLabel(mic.startTime),
            timeLabel: timeParts.value,
            timePeriod: timeParts.period,
          },
          geometry: {
            type: 'Point',
            coordinates: [longitude, latitude],
          },
        };
      }),
    }),
    [representativeMappedMics],
  );

  useEffect(() => {
    micLookupRef.current = new Map(representativeMappedMics.map(({ mic }) => [mic.uniqueIdentifier, mic]));
  }, [representativeMappedMics]);

  useEffect(() => {
    let cancelled = false;

    const initMap = async () => {
      const token = await getMapboxToken();
      if (cancelled) return;

      if (!token) {
        setError('Mapbox token is required to render the map.');
        return;
      }

      mapboxgl.accessToken = token;

      if (!mapContainerRef.current || mapRef.current) return;

      const map = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: NYC_CENTER,
        zoom: 14,
        minZoom: 6,
        maxZoom: 18,
      });

      mapRef.current = map;
      map.addControl(new mapboxgl.NavigationControl({ visualizePitch: false }), 'top-right');

      map.on('load', async () => {
        try {
          await Promise.all(
            PIN_IMAGE_IDS.flatMap((status) => [
              loadMapImage(map, `mic-pin-${status}`, `/map-pins/pin-${status}.png`),
              loadMapImage(map, `mic-dot-${status}`, `/map-pins/dot-${status}.png`),
            ]),
          );
        } catch (loadError) {
          console.warn('Failed to load map pin images:', loadError);
        }

        map.addSource('open-mics', {
          type: 'geojson',
          data: EMPTY_FEATURE_COLLECTION,
        });

        map.addLayer({
          id: 'open-mic-dots',
          type: 'symbol',
          source: 'open-mics',
          maxzoom: PIN_ZOOM_THRESHOLD,
          layout: {
            'icon-image': ['get', 'dotIcon'],
            'icon-size': 0.13,
            'icon-allow-overlap': true,
            'icon-ignore-placement': true,
          },
        });

        map.addLayer({
          id: 'open-mic-pins',
          type: 'symbol',
          source: 'open-mics',
          minzoom: PIN_ZOOM_THRESHOLD,
          layout: {
            'icon-image': ['get', 'pinIcon'],
            'icon-size': [
                'interpolate',
                ['linear'],
                ['zoom'],
                12.5, 0.14,  // At 12.5 zoom, pins are slightly smaller (14%)
                15.0, 0.18,  // At 15.0 zoom, pins reach standard display size (18%)
                18.0, 0.26   // At maximum 18.0 zoom, pins grow comfortably larger (26%)
            ],
            'icon-anchor': 'bottom',
            'icon-allow-overlap': true,
            'icon-ignore-placement': true,
            'text-field': [
              'format',
              ['to-string', ['get', 'timeLabel']],
              { 'font-scale': 1.08 },
              '\n',
              {},
              ['to-string', ['get', 'timePeriod']],
              { 'font-scale': 0.6 },
            ],
            'text-font': ['Open Sans Regular', 'Arial Unicode MS Regular'],
            'text-size': [
                'interpolate',
                ['linear'],
                ['zoom'],
                12.5, 9,    // Scale down text slightly at the starting threshold to fit the smaller pin asset
                15.0, 12,   // Standard readable font scale matching your middle zoom
                18.0, 17    // Expand the font to match the larger asset when zoomed all th
            ],
            'text-line-height': 1.25,
            'text-anchor': 'center',
            'text-offset': [0, -1.9],
            'text-padding': 10,
            'text-allow-overlap': false,
            'text-ignore-placement': false,
          },
          paint: {
            'text-color': '#111827',
            'text-halo-color': 'rgba(255,255,255,0.55)',
            'text-halo-width': 0.5,
          },
        });

        const handleMicLayerClick = (event: mapboxgl.MapLayerMouseEvent) => {
          const feature = event.features?.[0];
          const micId = feature?.properties?.micId;
          const mic = typeof micId === 'string' ? micLookupRef.current.get(micId) : null;
          const coordinates = feature?.geometry.type === 'Point' ? feature.geometry.coordinates as [number, number] : null;

          if (!mic || !coordinates) return;

          popupRef.current?.remove();
          popupRef.current = new mapboxgl.Popup({
            closeButton: false,
            className: 'comediq-map-popup',
            offset: {
              top: [0, 12],
              'top-left': [12, 12],
              'top-right': [-12, 12],
              bottom: [0, -50],
              'bottom-left': [12, -56],
              'bottom-right': [-12, -56],
              left: [18, -24],
              right: [-18, -24],
            },
          })
            .setLngLat(coordinates)
            .setHTML(buildPopupHtml(mic))
            .addTo(map);

          onMicSelectRef.current(mic);
        };

        map.on('click', 'open-mic-dots', (event) => {
          const feature = event.features?.[0];
          const coordinates = feature?.geometry.type === 'Point' ? feature.geometry.coordinates as [number, number] : null;
          if (!coordinates) return;
          map.easeTo({ center: coordinates, zoom: PIN_ZOOM_THRESHOLD + 0.8 });
        });

        map.on('click', 'open-mic-pins', handleMicLayerClick);

        ['open-mic-dots', 'open-mic-pins'].forEach((layerId) => {
          map.on('mouseenter', layerId, () => {
            map.getCanvas().style.cursor = 'pointer';
          });
          map.on('mouseleave', layerId, () => {
            map.getCanvas().style.cursor = '';
          });
        });

        setMapReady(true);
      });
    };

    initMap();

    return () => {
      cancelled = true;
      popupRef.current?.remove();
      userLocationMarkerRef.current?.remove();
      userLocationMarkerRef.current = null;
      mapRef.current?.remove();
      mapRef.current = null;
      setMapReady(false);
    };
  }, []);

  useEffect(() => {
    const source = mapRef.current ? getSource(mapRef.current) : undefined;
    source?.setData(micGeoJson);
  }, [micGeoJson, mapReady]);

  useEffect(() => {
    if (!mapReady || !mapRef.current) return;

    const viewportKey = getMappedMicsViewportKey(representativeMappedMics);
    if (!viewportKey || viewportKey === lastViewportKeyRef.current) return;

    lastViewportKeyRef.current = viewportKey;
    fitMapToMappedMics(mapRef.current, representativeMappedMics);
  }, [mapReady, representativeMappedMics]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === mapShellRef.current);
      window.setTimeout(() => mapRef.current?.resize(), 75);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = useCallback(async () => {
    const shell = mapShellRef.current;
    if (!shell) return;

    try {
      if (document.fullscreenElement === shell) {
        await document.exitFullscreen();
      } else {
        await shell.requestFullscreen();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to toggle fullscreen.');
    }
  }, []);

  const showUserLocationMarker = useCallback((coordinates: [number, number]) => {
    if (!mapRef.current) return;

    if (!userLocationMarkerRef.current) {
      const markerElement = document.createElement('div');
      markerElement.className = 'h-4 w-4 rounded-full border-2 border-white bg-[#1a5fb4] shadow-[0_0_0_6px_rgba(26,95,180,0.18)]';
      markerElement.setAttribute('aria-label', 'Your location');

      userLocationMarkerRef.current = new mapboxgl.Marker({ element: markerElement })
        .setLngLat(coordinates)
        .addTo(mapRef.current);
      return;
    }

    userLocationMarkerRef.current.setLngLat(coordinates);
  }, []);

  const recenterOnUserLocation = useCallback(async () => {
    if (!LocationService.isLocationSupported()) {
      setError('Geolocation is not supported by this browser.');
      return;
    }

    setLocationLoading(true);
    try {
      const [longitude, latitude] = await LocationService.getUserLocation();
      showUserLocationMarker([longitude, latitude]);
      mapRef.current?.flyTo({ center: [longitude, latitude], zoom: 14, essential: true });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to get your location.');
    } finally {
      setLocationLoading(false);
    }
  }, [showUserLocationMarker]);

  useEffect(() => {
    if (mapReady && !hasRequestedLocationRef.current && LocationService.isLocationSupported()) {
      hasRequestedLocationRef.current = true;
      recenterOnUserLocation();
    }
  }, [mapReady, recenterOnUserLocation]);

  return (
    <div className="w-full">
      <div
        ref={mapShellRef}
        className="relative w-full h-96 rounded-lg overflow-hidden border border-border bg-white fullscreen:h-screen fullscreen:w-screen fullscreen:rounded-none fullscreen:border-0"
      >
        {mapReady && (
          <>
            <div className="absolute top-2 left-2 z-10 group">
              <div className="flex items-center gap-1 mb-1 text-xs text-muted-foreground opacity-100">
                <Info className="w-3 h-3" />
                <span>Legend</span>
              </div>
              <div className="opacity-0 group-hover:opacity-90 transition-opacity duration-200">
                <MapLegend />
              </div>
            </div>
          </>
        )}

        <div ref={mapContainerRef} className="h-full w-full" />

        {error && !mapReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 px-4 text-center text-sm text-muted-foreground">
            {error}
          </div>
        )}

        {!mapReady && !error && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70 text-sm text-muted-foreground">
            Loading map...
          </div>
        )}

        {mapReady && (
          <MapControls
            onRecenter={recenterOnUserLocation}
            onToggleFullscreen={toggleFullscreen}
            locationLoading={locationLoading}
            isFullscreen={isFullscreen}
            error={error}
            onDismissError={() => setError(null)}
            loadedMicCount={representativeMappedMics.length}
            totalMicCount={mics.length}
            countLabel="pins mapped"
            backgroundLoading={false}
          />
        )}
      </div>
    </div>
  );
};

const arePropsEqual = (prevProps: OpenMicsMapProps, nextProps: OpenMicsMapProps) => {
  if (prevProps.mics.length !== nextProps.mics.length) return false;
  for (let i = 0; i < prevProps.mics.length; i++) {
    if (prevProps.mics[i].uniqueIdentifier !== nextProps.mics[i].uniqueIdentifier) return false;
  }
  return true;
};

export default memo(OpenMicsMapRefactored, arePropsEqual);
