import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { COMEDIQ_Q_INSET, COMEDIQ_Q_LOGO } from '@/lib/brand';
import type { FeatureCollection, Point } from 'geojson';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Info } from 'lucide-react';
import { useTheme } from 'next-themes';
import { OpenMic } from '@/types/openMic';
import { LocationService } from './LocationService';
import { MapControls } from './MapControls';
import { MapLegend } from './MapLegend';
import { getMapboxToken } from './MapInitializer';
import { formatCost, formatStageTime, formatTime } from './MapUtils';
import { VenueEventCards } from './VenueEventCards';
import { useMicSkips } from '@/hooks/useMicSkips';
import { useNow } from '@/hooks/useNow';
import { v3bubblePalette, v3colors } from '@/theme/v3';
import {
  buildVenues,
  sortVenuesForDrawing,
  type Venue,
  type VenueTier,
} from '@/utils/venues';

interface OpenMicsMapProps {
  mics: OpenMic[];
  onMicSelect: (mic: OpenMic) => void;
  variant?: 'boxed' | 'full';
  /**
   * Which venue is open. Pass this together with `onSelectVenue` to drive the
   * selection from outside - the desktop split view does, so clicking a row in
   * its list and clicking a bubble on the map are the same action. Left
   * undefined the map keeps its own selection.
   */
  selectedVenueKey?: string | null;
  onSelectVenue?: (key: string | null) => void;
  /** Grows a bubble without opening it, for hovering a row in the list. */
  highlightedVenueKey?: string | null;
  /** The split view draws its own preview beside the map, not over it. */
  hidePreviewCard?: boolean;
}

type MicFeatureProperties = {
  micId: string;
  dotIcon: string;
  pinIcon: string;
  pinLabel: string;
  timeLabel: string;
  timePeriod: string;
  iconOpacity: number;
};
type MappedMic = { mic: OpenMic; latitude: number; longitude: number };

const MINUTES_PER_DAY = 24 * 60;
const NYC_CENTER: [number, number] = [-73.935242, 40.73061];
const LOGO_PIN_IMAGE_ID = 'mic-logo-pin';
const LOGO_DOT_IMAGE_ID = 'mic-logo-dot';
const LOGO_PIN_IMAGE_URL = COMEDIQ_Q_LOGO;
const LOGO_DOT_IMAGE_URL = COMEDIQ_Q_LOGO;
const LOGO_PIN_PIXEL_RATIO = 1.5;
const LOGO_DOT_PIXEL_RATIO = 1.5;
const PIN_ZOOM_THRESHOLD = 12.5;

// v3 map bubbles. Spec: docs/design/storytime-redesign-v3/SPEC.md, "Map rules".
//
//   - One round bubble per venue: the host's map icon, or initials on a
//     Comediq blue. Comediq-run mics use the Q logo.
//   - Sizes: Comediq-run largest, happening today medium, other days small.
//     Bigger on top. Unverified faded.
//   - Zoomed out the bubbles shrink and overlap. No number clusters.
//
// The grouping, the tiers and the now/next/ended maths all live in
// `src/utils/venues.ts`, which is a port of the mobile app's file of the same
// name, so the two platforms agree about what is on tonight.
//
// Set to false to bring back the old Comediq pin layers (they are still in the
// file, just hidden).
const USE_BUBBLE_MARKERS = true;

/** Diameters from the boards. */
const BUBBLE_SIZE: Record<VenueTier, number> = {
  comediq: 54,
  today: 44,
  other: 34,
};

/** Smaller when zoomed out (dense overlap), full size from zoom 14 in. */
function bubbleScaleForZoom(zoom: number): number {
  return Math.max(0.45, Math.min(1, 0.45 + (zoom - 10) * 0.14));
}

function venueHash(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) hash = (hash * 31 + value.charCodeAt(i)) % 100000;
  return hash;
}

/** What a screen reader hears on a bubble: the venue, then what is on. */
function bubbleLabel(venue: Venue): string {
  const counts: string[] = [];
  if (venue.nowCount > 0) counts.push(`${venue.nowCount} happening now`);
  if (venue.nextCount > 0) counts.push(`${venue.nextCount} later tonight`);
  if (counts.length === 0) counts.push('nothing on tonight');
  return `${venue.name}, ${counts.join(', ')}`;
}
const EMPTY_FEATURE_COLLECTION: FeatureCollection<Point, MicFeatureProperties> = {
  type: 'FeatureCollection',
  features: [],
};
const LIGHT_MAP_STYLE = 'mapbox://styles/mapbox/streets-v12';
const DARK_MAP_STYLE = 'mapbox://styles/mapbox/dark-v11';

function parseCoordinate(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function isVerifiedMicStatus(mic: OpenMic): boolean {
  return mic.status?.toLowerCase() === 'verified';
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

function normalizeVenueGroupKey(mic: OpenMic): string {
  const venueKey = [mic.venueName, mic.location, mic.city]
    .map((value) => value?.trim().toLowerCase())
    .filter(Boolean)
    .join('|');

  return venueKey || mic.uniqueIdentifier;
}

function getMicPinSortMinutes(mic: OpenMic): number {
  return parseMicStartMinutes(mic) ?? Number.MAX_SAFE_INTEGER;
}

function getMinutesUntilNextMic(mic: OpenMic, date = new Date()): number {
  const weekdayIndex = getMicWeekdayIndex(mic);
  const startMinutes = parseMicStartMinutes(mic);

  if (weekdayIndex === null || startMinutes === null) {
    return Number.MAX_SAFE_INTEGER;
  }

  const currentMinutes = date.getHours() * 60 + date.getMinutes();
  const daysUntil = (weekdayIndex - date.getDay() + 7) % 7;
  const minutesUntil = daysUntil * MINUTES_PER_DAY + startMinutes - currentMinutes;

  return minutesUntil >= 0 ? minutesUntil : minutesUntil + 7 * MINUTES_PER_DAY;
}

function getRepresentativeMappedMic(mics: MappedMic[]): MappedMic {
  const [representativeMic] = [...mics].sort((a, b) => {
    const aMinutesUntilNext = getMinutesUntilNextMic(a.mic);
    const bMinutesUntilNext = getMinutesUntilNextMic(b.mic);

    if (aMinutesUntilNext !== bMinutesUntilNext) {
      return aMinutesUntilNext - bMinutesUntilNext;
    }

    return getMicPinSortMinutes(a.mic) - getMicPinSortMinutes(b.mic);
  });

  return representativeMic ?? mics[0];
}

function getRepresentativeMappedMics(mics: MappedMic[]): MappedMic[] {
  const groupsByVenue = new Map<string, MappedMic[]>();

  mics.forEach((mappedMic) => {
    const key = normalizeVenueGroupKey(mappedMic.mic);
    const groupedMics = groupsByVenue.get(key);

    if (groupedMics) {
      groupedMics.push(mappedMic);
    } else {
      groupsByVenue.set(key, [mappedMic]);
    }
  });

  return Array.from(groupsByVenue.values()).map(getRepresentativeMappedMic);
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
  const startTime = formatTime(mic.startTime);
  const endTime = formatTime(mic.latestEndTime);
  const timeLabel = endTime ? `${startTime} - ${endTime}` : startTime;

  return `
    <div style="min-width:180px;padding:8px;font-size:13px;color:#0f172a;">
      <div style="font-weight:800;font-size:15px;margin-bottom:3px;">${escapeHtml(mic.openMic)}</div>
      <div style="color:#475569;margin-bottom:6px;">${escapeHtml(mic.venueName)}</div>
      <div>${escapeHtml(timeLabel)}</div>
      <div>${escapeHtml(formatCost(mic.cost))}</div>
      <div>Stage time: ${escapeHtml(formatStageTime(mic.stageTime))}</div>
    </div>
  `;
}

function loadMapImage(
  map: mapboxgl.Map,
  id: string,
  url: string,
  options?: any,
): Promise<void> {
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
        map.addImage(id, image, options);
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

const OpenMicsMapRefactored = ({
  mics,
  onMicSelect,
  variant = 'boxed',
  selectedVenueKey: controlledVenueKey,
  onSelectVenue,
  highlightedVenueKey = null,
  hidePreviewCard = false,
}: OpenMicsMapProps) => {
  const { resolvedTheme } = useTheme();
  const mapShellRef = useRef<HTMLDivElement | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const mapStyleRef = useRef<string>(LIGHT_MAP_STYLE);
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
  const [legendOpen, setLegendOpen] = useState(false);
  const mapStyle = resolvedTheme === 'dark' ? DARK_MAP_STYLE : LIGHT_MAP_STYLE;
  const bubbleMarkersRef = useRef<mapboxgl.Marker[]>([]);
  // A minute-ticking clock, so "Happening now" stops saying that when the mic
  // actually ends rather than when the visitor happens to reload.
  const now = useNow();
  const { skips } = useMicSkips();

  // Controlled when the parent passes a key, self-managed otherwise.
  const [ownVenueKey, setOwnVenueKey] = useState<string | null>(null);
  const isControlled = controlledVenueKey !== undefined;
  const selectedVenueKey = isControlled ? controlledVenueKey : ownVenueKey;
  const setSelectedVenueKey = useCallback(
    (key: string | null) => {
      if (!isControlled) setOwnVenueKey(key);
      onSelectVenue?.(key);
    },
    [isControlled, onSelectVenue],
  );

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

  // One venue per bubble, with each venue's events split into
  // now / next / ended. Shared with the mobile app via src/utils/venues.ts.
  const venues = useMemo(() => buildVenues(mics, now, skips), [mics, now, skips]);

  const selectedVenue = useMemo(
    () => venues.find((venue) => venue.key === selectedVenueKey) ?? null,
    [venues, selectedVenueKey],
  );

  const micGeoJson = useMemo<FeatureCollection<Point, MicFeatureProperties>>(
    () => ({
      type: 'FeatureCollection',
      features: representativeMappedMics.map(({ mic, latitude, longitude }) => {
        const timeParts = getPinTimeParts(mic.startTime);
        const iconOpacity = isVerifiedMicStatus(mic) ? 1 : 0.48;
        return {
          type: 'Feature',
          id: mic.uniqueIdentifier,
          properties: {
            micId: mic.uniqueIdentifier,
            dotIcon: LOGO_DOT_IMAGE_ID,
            pinIcon: LOGO_PIN_IMAGE_ID,
            pinLabel: getPinLabel(mic.startTime),
            timeLabel: timeParts.value,
            timePeriod: timeParts.period,
            iconOpacity,
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

      mapStyleRef.current = mapStyle;
      const map = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: mapStyle,
        center: NYC_CENTER,
        zoom: 14,
        minZoom: 6,
        maxZoom: 18,
      });

      mapRef.current = map;
      map.addControl(new mapboxgl.NavigationControl({ visualizePitch: false }), 'top-right');
      let layerHandlersRegistered = false;

      const addOpenMicLayers = async () => {
        try {
          await Promise.all([
            loadMapImage(map, LOGO_PIN_IMAGE_ID, LOGO_PIN_IMAGE_URL, { pixelRatio: LOGO_PIN_PIXEL_RATIO }),
            loadMapImage(map, LOGO_DOT_IMAGE_ID, LOGO_DOT_IMAGE_URL, { pixelRatio: LOGO_DOT_PIXEL_RATIO }),
          ]);
        } catch (loadError) {
          console.warn('Failed to load map pin images:', loadError);
        }

        if (!map.getSource('open-mics')) {
          map.addSource('open-mics', {
            type: 'geojson',
            data: EMPTY_FEATURE_COLLECTION,
          });
        }

        if (!map.getLayer('open-mic-dots')) {
          map.addLayer({
            id: 'open-mic-dots',
            type: 'symbol',
            source: 'open-mics',
            maxzoom: PIN_ZOOM_THRESHOLD,
            layout: {
              'icon-image': ['get', 'dotIcon'],
              'icon-size': [
                'interpolate',
                ['linear'],
                ['zoom'],
                6, 0.035,
                10, 0.06,
                12, 0.10
              ],
              'icon-allow-overlap': true,
              'icon-ignore-placement': true,
            },
            paint: {
              'icon-opacity': ['get', 'iconOpacity'],
            },
          });
        }

        if (!map.getLayer('open-mic-pins')) {
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
                12.5, 0.18,
                15.0, 0.28,
                18.0, 0.40
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
                12.5, 6.75,
                13.5, 8,
                15.0, 10.5,
                18.0, 15
            ],
            'text-line-height': 1.25,
            'text-anchor': 'center',
            'text-justify': 'center',
            'text-offset': [
                'interpolate',
                ['linear'],
                ['zoom'],
                12.5, ['literal', [0, -4.20]],
                13.5, ['literal', [0, -4.25]],
                15.0, ['literal', [0, -4.25]],
                18.0, ['literal', [0, -4.25]]
            ],
            'text-padding': 10,
            'text-allow-overlap': false,
            'text-ignore-placement': false,
            },
            paint: {
              'icon-opacity': ['get', 'iconOpacity'],
              'text-color': '#111827',
              'text-halo-color': 'rgba(255,255,255,0.55)',
              'text-halo-width': 0.5,
            },
          });
        }

        if (!layerHandlersRegistered) {
          layerHandlersRegistered = true;
          const handleMicLayerClick = (event: mapboxgl.MapLayerMouseEvent) => {
          const feature = event.features?.[0];
          const micId = (feature as any)?.properties?.micId;
          const mic = typeof micId === 'string' ? micLookupRef.current.get(micId) : null;
          const coordinates = (feature as any)?.geometry.type === 'Point' ? (feature as any).geometry.coordinates as [number, number] : null;

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
            const coordinates = (feature as any)?.geometry.type === 'Point' ? (feature as any).geometry.coordinates as [number, number] : null;
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
        }

        if (USE_BUBBLE_MARKERS) {
          ['open-mic-dots', 'open-mic-pins'].forEach((layerId) => {
            if (map.getLayer(layerId)) map.setLayoutProperty(layerId, 'visibility', 'none');
          });
        }

        setMapReady(true);
      };

      map.on('load', addOpenMicLayers);
      map.on('style.load', addOpenMicLayers);
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
    const map = mapRef.current;
    if (!map || mapStyleRef.current === mapStyle) return;

    popupRef.current?.remove();
    popupRef.current = null;
    setMapReady(false);
    mapStyleRef.current = mapStyle;
    map.setStyle(mapStyle);
  }, [mapStyle]);

  useEffect(() => {
    const source = mapRef.current ? getSource(mapRef.current) : undefined;
    source?.setData(micGeoJson);
  }, [micGeoJson, mapReady]);

  // Bubble markers (Storytime style)
  useEffect(() => {
    const map = mapRef.current;
    if (!USE_BUBBLE_MARKERS || !mapReady || !map) return;

    const container = map.getContainer();
    const applyScale = () => container.style.setProperty('--cq-bubble-scale', String(bubbleScaleForZoom(map.getZoom())));
    applyScale();
    map.on('zoom', applyScale);

    const handleMapClick = (event: mapboxgl.MapMouseEvent) => {
      const target = event.originalEvent?.target as HTMLElement | null;
      if (target?.closest?.('.cq-bubble-btn')) return;
      setSelectedVenueKey(null);
    };
    map.on('click', handleMapClick);

    // Smaller tiers first, so the bigger bubbles are painted on top.
    bubbleMarkersRef.current = sortVenuesForDrawing(venues).map((venue, index) => {
      const size = BUBBLE_SIZE[venue.tier];
      const wrap = document.createElement('div');
      wrap.style.zIndex = String(size * 1000 + index);

      const inner = document.createElement('div');
      inner.className = 'cq-bubble-wrap';

      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'cq-bubble-btn';
      button.style.width = `${size}px`;
      button.style.height = `${size}px`;
      button.setAttribute('aria-label', bubbleLabel(venue));
      button.dataset.venueKey = venue.key;

      const bubble = document.createElement('span');
      bubble.className = 'cq-bubble' + (venue.isUnverified ? ' cq-bubble--muted' : '');
      bubble.style.width = `${size}px`;
      bubble.style.height = `${size}px`;
      bubble.style.left = '0px';

      // The host's own circular icon wins; a Comediq-run venue falls back to
      // the Q mark; anything else is initials on a cycled Comediq blue.
      if (venue.iconUrl) {
        bubble.style.backgroundImage = `url("${venue.iconUrl.replace(/"/g, '%22')}")`;
      } else if (venue.tier === 'comediq') {
        bubble.style.background = v3colors.white;
        bubble.style.backgroundImage = `url(${LOGO_PIN_IMAGE_URL})`;
        bubble.style.backgroundSize = COMEDIQ_Q_INSET;
        bubble.style.backgroundRepeat = 'no-repeat';
      } else {
        const [bg, fg] = v3bubblePalette[venueHash(venue.key) % v3bubblePalette.length];
        bubble.style.background = bg;
        bubble.style.color = fg;
        bubble.style.fontSize = `${Math.round(size * 0.34)}px`;
        bubble.textContent = venue.initials;
      }
      button.appendChild(bubble);

      button.addEventListener('click', (event) => {
        event.stopPropagation();
        setSelectedVenueKey(venue.key);
        map.easeTo({
          center: [venue.longitude, venue.latitude],
          zoom: Math.max(map.getZoom(), 14),
          duration: 500,
        });
      });

      inner.appendChild(button);
      wrap.appendChild(inner);
      return new mapboxgl.Marker({ element: wrap, anchor: 'center' })
        .setLngLat([venue.longitude, venue.latitude])
        .addTo(map);
    });

    return () => {
      map.off('zoom', applyScale);
      map.off('click', handleMapClick);
      bubbleMarkersRef.current.forEach((marker) => marker.remove());
      bubbleMarkersRef.current = [];
    };
  }, [mapReady, venues, setSelectedVenueKey]);

  // The sky ring the boards draw around the tapped venue. Kept out of the
  // marker effect above so selecting a venue does not rebuild every bubble.
  useEffect(() => {
    if (!USE_BUBBLE_MARKERS) return;
    const container = mapRef.current?.getContainer();
    if (!container) return;

    container.querySelectorAll('.cq-bubble-btn[data-selected="true"]').forEach((node) => {
      node.removeAttribute('data-selected');
    });
    container.querySelectorAll('.cq-bubble-btn[data-hovered="true"]').forEach((node) => {
      node.removeAttribute('data-hovered');
    });

    // CSS.escape, because a venue key is "<name>@<lat>,<lng>" and carries
    // characters a plain attribute selector would choke on.
    const find = (key: string) =>
      container.querySelector(`.cq-bubble-btn[data-venue-key="${CSS.escape(key)}"]`);

    if (selectedVenueKey) find(selectedVenueKey)?.setAttribute('data-selected', 'true');
    // Hovering a row in the desktop list grows its bubble without opening it.
    if (highlightedVenueKey && highlightedVenueKey !== selectedVenueKey) {
      find(highlightedVenueKey)?.setAttribute('data-hovered', 'true');
    }
  }, [selectedVenueKey, highlightedVenueKey, venues, mapReady]);

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
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if (typeof (document as any).webkitExitFullscreen === 'function') {
          await (document as any).webkitExitFullscreen();
        }
      } else {
        const requestFullscreen =
          shell.requestFullscreen ||
          (shell as any).webkitRequestFullscreen ||
          (shell as any).mozRequestFullScreen ||
          (shell as any).msRequestFullscreen;

        if (typeof requestFullscreen !== 'function') {
          setError('Fullscreen is not supported by this browser.');
          return;
        }

        await requestFullscreen.call(shell);
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
    <div className="w-full h-full">
      <div
        ref={mapShellRef}
        className={
          variant === 'full'
            ? "relative w-full h-full overflow-hidden bg-white fullscreen:h-screen fullscreen:w-screen fullscreen:rounded-none fullscreen:border-0"
            : "relative w-full h-96 rounded-lg overflow-hidden border border-border bg-white fullscreen:h-screen fullscreen:w-screen fullscreen:rounded-none fullscreen:border-0"
        }
      >
        {mapReady && (
          <>
            <div className="absolute top-2 left-2 z-10">
              <div className="flex items-center gap-1 mb-1 text-xs text-muted-foreground opacity-100">
                <Info className="w-3 h-3" />
                <span
                  tabIndex={0}
                  onMouseEnter={() => setLegendOpen(true)}
                  onMouseLeave={() => setLegendOpen(false)}
                  onFocus={() => setLegendOpen(true)}
                  onBlur={() => setLegendOpen(false)}
                  className="cursor-help rounded-sm focus:outline-none focus:ring-2 focus:ring-[#1a5fb4]/40"
                >
                  Legend
                </span>
              </div>
              <div className={`pointer-events-none transition-opacity duration-200 ${legendOpen ? 'opacity-90' : 'opacity-0'}`}>
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

        {USE_BUBBLE_MARKERS && (
          <style>{`
            .cq-bubble-wrap{transform:scale(var(--cq-bubble-scale,1));transform-origin:center;transition:transform .15s ease-out}
            .cq-bubble-btn{position:relative;display:block;background:none;border:0;padding:0;cursor:pointer}
            .cq-bubble{position:absolute;top:0;border-radius:9999px;border:2.5px solid #fff;box-shadow:0 4px 12px rgba(8,20,43,.28);background-size:cover;background-position:center;display:flex;align-items:center;justify-content:center;font-weight:800;letter-spacing:-.02em;overflow:hidden;box-sizing:border-box}
            .cq-bubble--muted{opacity:.6}
            .cq-bubble-btn:focus-visible,.cq-bubble-btn[data-selected="true"]{outline:3px solid #8FC2F5;outline-offset:4px;border-radius:9999px}
            .cq-bubble-btn[data-hovered="true"]{transform:scale(1.15);transition:transform .12s ease-out}
          `}</style>
        )}

        {/* v3 preview: only what has not ended at the tapped venue, "Happening
            now" first. Phone gets the swipeable carousel from
            MapBubbles.dc.html; the desktop split view passes layout="stack"
            and renders its own copy, per WebMap.dc.html. */}
        {selectedVenue && !hidePreviewCard && (
          <div
            className="absolute inset-x-0 z-20 px-3 font-dmsans"
            style={variant === 'full' ? { top: 84 } : { bottom: 12 }}
          >
            <div className="mx-auto max-w-md">
              <VenueEventCards
                venue={selectedVenue}
                now={now}
                onClose={() => setSelectedVenueKey(null)}
                onSelectEvent={(event) => onMicSelectRef.current(event.mic)}
              />
            </div>
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
