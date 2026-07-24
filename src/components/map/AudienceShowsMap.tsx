import React, { useEffect, useMemo, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { format, parseISO } from 'date-fns';
import { useTheme } from 'next-themes';
import { AudienceShow } from '@/api/audienceShows';
import { getMapboxToken } from './MapInitializer';
import { getShowTypeColor, SHOW_TYPE_COLORS } from './MapUtils';

interface AudienceShowsMapProps {
  shows: AudienceShow[];
}

interface VenueGroup {
  key: string;
  venueName: string;
  latitude: number;
  longitude: number;
  shows: AudienceShow[];
}

type VenueFeatureProperties = {
  key: string;
  color: string;
};

const NYC_CENTER: [number, number] = [-73.9352, 40.7308];
const LIGHT_MAP_STYLE = 'mapbox://styles/mapbox/streets-v12';
const DARK_MAP_STYLE = 'mapbox://styles/mapbox/dark-v11';
const EMPTY_FEATURE_COLLECTION: GeoJSON.FeatureCollection<GeoJSON.Point, VenueFeatureProperties> = {
  type: 'FeatureCollection',
  features: [],
};

function parseCoordinate(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

const formatShowDateTime = (dateStr: string, timeStr: string): string => {
  try {
    const date = parseISO(dateStr);
    const day = format(date, 'EEE, MMM d');
    const time = timeStr?.replace(/:\d{2}$/, '').trim() || '';
    return time ? `${day} · ${time}` : day;
  } catch {
    return `${dateStr} · ${timeStr}`;
  }
};

const formatPrice = (show: AudienceShow): string => {
  if (show.price_cents != null && show.price_cents > 0) {
    return `$${(show.price_cents / 100).toFixed(0)}`;
  }
  if (show.ticket_price) return show.ticket_price;
  if (!show.is_paid) return 'Free';
  return '';
};

function getSource(map: mapboxgl.Map): mapboxgl.GeoJSONSource | undefined {
  return map.getSource('audience-shows') as mapboxgl.GeoJSONSource | undefined;
}

const AudienceShowsMap: React.FC<AudienceShowsMapProps> = ({ shows }) => {
  const { resolvedTheme } = useTheme();
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const mapStyleRef = useRef<string>(LIGHT_MAP_STYLE);

  const [mapReady, setMapReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bottomSheet, setBottomSheet] = useState<{ venueName: string; shows: AudienceShow[] } | null>(null);
  const mapStyle = resolvedTheme === 'dark' ? DARK_MAP_STYLE : LIGHT_MAP_STYLE;

  const venueGroups = useMemo<VenueGroup[]>(() => {
    const map = new Map<string, VenueGroup>();
    for (const show of shows) {
      const latitude = parseCoordinate(show.latitude);
      const longitude = parseCoordinate(show.longitude);
      if (latitude === null || longitude === null) continue;

      const key = `${show.venue_name}:${latitude.toFixed(5)}:${longitude.toFixed(5)}`;
      if (!map.has(key)) {
        map.set(key, { key, venueName: show.venue_name, latitude, longitude, shows: [] });
      }
      map.get(key)!.shows.push(show);
    }
    return Array.from(map.values());
  }, [shows]);

  const venueGroupLookup = useMemo(
    () => new Map(venueGroups.map((group) => [group.key, group])),
    [venueGroups],
  );

  const features = useMemo<GeoJSON.FeatureCollection<GeoJSON.Point, VenueFeatureProperties>>(
    () => ({
      type: 'FeatureCollection',
      features: venueGroups.map((group) => ({
        type: 'Feature',
        id: group.key,
        properties: {
          key: group.key,
          color: getShowTypeColor(group.shows[0]?.show_type ?? null),
        },
        geometry: {
          type: 'Point',
          coordinates: [group.longitude, group.latitude],
        },
      })),
    }),
    [venueGroups],
  );

  useEffect(() => {
    let cancelled = false;

    const initMap = async () => {
      const token = await getMapboxToken();
      if (cancelled) return;

      if (!token) {
        setError('Mapbox token is required to render the map.');
        return;
      }

      if (!mapContainerRef.current || mapRef.current) return;

      mapboxgl.accessToken = token;
      mapStyleRef.current = mapStyle;

      const map = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: mapStyle,
        center: NYC_CENTER,
        zoom: 12,
        minZoom: 6,
        maxZoom: 18,
      });

      mapRef.current = map;
      map.addControl(new mapboxgl.NavigationControl({ visualizePitch: false }), 'top-right');
      let layerHandlersRegistered = false;

      const addAudienceShowLayers = () => {
        if (!map.getSource('audience-shows')) {
          map.addSource('audience-shows', {
            type: 'geojson',
            data: EMPTY_FEATURE_COLLECTION,
            cluster: true,
            clusterMaxZoom: 13,
            clusterRadius: 48,
          });
        }

        if (!map.getLayer('audience-show-clusters')) {
          map.addLayer({
            id: 'audience-show-clusters',
            type: 'circle',
            source: 'audience-shows',
            filter: ['has', 'point_count'],
            paint: {
              'circle-color': ['step', ['get', 'point_count'], '#f97316', 10, '#f5c542', 50, '#ef4444'],
              'circle-radius': ['step', ['get', 'point_count'], 18, 10, 22, 50, 26],
              'circle-stroke-color': '#ffffff',
              'circle-stroke-width': 2,
            },
          });
        }

        if (!map.getLayer('audience-show-cluster-count')) {
          map.addLayer({
            id: 'audience-show-cluster-count',
            type: 'symbol',
            source: 'audience-shows',
            filter: ['has', 'point_count'],
            layout: {
              'text-field': ['get', 'point_count_abbreviated'],
              'text-size': 13,
              'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
            },
            paint: {
              'text-color': '#111827',
            },
          });
        }

        if (!map.getLayer('audience-show-pins')) {
          map.addLayer({
            id: 'audience-show-pins',
            type: 'circle',
            source: 'audience-shows',
            filter: ['!', ['has', 'point_count']],
            paint: {
              'circle-color': ['get', 'color'],
              'circle-radius': 8,
              'circle-stroke-color': '#ffffff',
              'circle-stroke-width': 2,
            },
          });
        }

        if (!map.getLayer('audience-show-pin-core')) {
          map.addLayer({
            id: 'audience-show-pin-core',
            type: 'circle',
            source: 'audience-shows',
            filter: ['!', ['has', 'point_count']],
            paint: {
              'circle-color': '#111827',
              'circle-radius': 3,
              'circle-opacity': 0.7,
            },
          });
        }

        if (!layerHandlersRegistered) {
          layerHandlersRegistered = true;
          map.on('click', 'audience-show-clusters', (event) => {
          const renderedFeatures = map.queryRenderedFeatures(event.point, { layers: ['audience-show-clusters'] });
          const clusterId = renderedFeatures[0]?.properties?.cluster_id;
          const source = getSource(map);
          if (clusterId === undefined || !source) return;

          source.getClusterExpansionZoom(clusterId, (zoomError, zoom) => {
            if (zoomError || zoom === undefined) return;
            const coordinates = (renderedFeatures[0].geometry as GeoJSON.Point).coordinates as [number, number];
            map.easeTo({ center: coordinates, zoom });
          });
          });

          map.on('click', 'audience-show-pins', (event) => {
            const key = event.features?.[0]?.properties?.key;
            const group = typeof key === 'string' ? venueGroupLookup.get(key) : null;
            if (group) {
              setBottomSheet({ venueName: group.venueName, shows: group.shows });
            }
          });

          ['audience-show-clusters', 'audience-show-pins'].forEach((layerId) => {
            map.on('mouseenter', layerId, () => {
              map.getCanvas().style.cursor = 'pointer';
            });
            map.on('mouseleave', layerId, () => {
              map.getCanvas().style.cursor = '';
            });
          });
        }

        setMapReady(true);
      };

      map.on('load', addAudienceShowLayers);
      map.on('style.load', addAudienceShowLayers);
    };

    initMap();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      setMapReady(false);
    };
  }, [venueGroupLookup]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || mapStyleRef.current === mapStyle) return;

    setBottomSheet(null);
    setMapReady(false);
    mapStyleRef.current = mapStyle;
    map.setStyle(mapStyle);
  }, [mapStyle]);

  useEffect(() => {
    const source = mapRef.current ? getSource(mapRef.current) : undefined;
    source?.setData(features);
  }, [features, mapReady]);

  return (
    <div className="relative w-full h-full">
      <div className="hidden md:block absolute top-3 left-3 z-10 rounded-lg border border-border bg-white/95 px-3 py-2 text-xs shadow-sm space-y-1">
        {SHOW_TYPE_COLORS.map(({ label, color }) => (
          <div key={label} className="flex items-center gap-2">
            <span
              className="inline-block w-3 h-3 rounded-full border border-slate-600 flex-shrink-0"
              style={{ backgroundColor: color }}
            />
            <span className="text-slate-700">{label}</span>
          </div>
        ))}
      </div>

      {venueGroups.length > 0 && (
        <div className="absolute bottom-8 left-3 z-10 rounded-lg border border-border bg-white/95 px-3 py-1.5 text-xs text-slate-700 shadow-sm">
          {venueGroups.length} venue{venueGroups.length !== 1 ? 's' : ''} mapped · upcoming
        </div>
      )}

      {shows.length > 0 && venueGroups.length === 0 && mapReady && (
        <div className="absolute inset-x-4 top-20 z-10 flex justify-center pointer-events-none">
          <div className="rounded-lg border border-border bg-white/95 px-3 py-2 text-center text-sm text-muted-foreground shadow-sm">
            {shows.length} upcoming show{shows.length !== 1 ? 's' : ''} found, but none have stored coordinates yet.
          </div>
        </div>
      )}

      {bottomSheet && (
        <>
          <div className="absolute inset-0 z-20" onClick={() => setBottomSheet(null)} />
          <div className="absolute bottom-0 left-0 right-0 z-30 bg-white rounded-t-2xl shadow-2xl flex flex-col max-h-[65vh]">
            <div className="flex justify-center pt-2 pb-1 flex-shrink-0">
              <div className="w-10 h-1 rounded-full bg-slate-300" />
            </div>
            <div className="flex items-center justify-between px-4 py-2 border-b border-slate-100 flex-shrink-0">
              <h2 className="font-bold text-base text-slate-900 truncate pr-2">{bottomSheet.venueName}</h2>
              <button
                onClick={() => setBottomSheet(null)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none flex-shrink-0"
              >
                x
              </button>
            </div>
            <div className="overflow-y-auto flex-1 px-4 py-3 space-y-4">
              {bottomSheet.shows.map((show, i) => {
                const dateTime = formatShowDateTime(show.show_date, show.show_time);
                const price = formatPrice(show);
                const ticketUrl = show.external_ticket_url || show.ticket_url;
                return (
                  <div key={show.id} className={`pb-3 ${i < bottomSheet.shows.length - 1 ? 'border-b border-slate-100' : ''}`}>
                    {show.show_type && (
                      <span className="text-[10px] uppercase tracking-wider text-slate-400">{show.show_type}</span>
                    )}
                    <div className="font-semibold text-slate-900 text-sm mt-0.5">{show.title}</div>
                    <div className="text-slate-500 text-xs mt-0.5">{dateTime}</div>
                    {price && <div className="text-orange-500 text-xs font-semibold mt-0.5">{price}</div>}
                    {ticketUrl && (
                      <a
                        href={ticketUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block mt-2 px-3 py-1 bg-orange-500 text-white text-xs font-semibold rounded"
                      >
                        Get Tickets →
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      <div ref={mapContainerRef} className="h-full w-full" />
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 px-4 text-center text-sm text-muted-foreground">
          {error}
        </div>
      )}
      {!mapReady && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/70 text-sm text-muted-foreground">
          Loading map...
        </div>
      )}
    </div>
  );
};

export default AudienceShowsMap;
