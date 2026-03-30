import React, { useEffect, useRef, useState, useMemo } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet.markercluster';
import './leaflet-dark.css';
import { AudienceShow } from '@/api/audienceShows';
import { GeocodingService, GeocodingProgress } from './GeocodingService';
import { getMapboxToken } from './MapInitializer';
import { getShowTypeColor, SHOW_TYPE_COLORS } from './MapUtils';
import { format, parseISO } from 'date-fns';

interface AudienceShowsMapProps {
  shows: AudienceShow[];
}

interface VenueGroup {
  key: string;       // address used as geocoding key
  venueName: string;
  shows: AudienceShow[];
}

const CARTO_DARK_URL = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png';
const CARTO_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

const SUBWAY_LINE_COLORS: Record<string, string> = {
  '1': '#EE352E', '2': '#EE352E', '3': '#EE352E',
  '4': '#00933C', '5': '#00933C', '6': '#00933C',
  '7': '#B933AD',
  'A': '#0039A6', 'C': '#0039A6', 'E': '#0039A6',
  'B': '#FF6319', 'D': '#FF6319', 'F': '#FF6319', 'M': '#FF6319',
  'G': '#6CBE45',
  'J': '#996633', 'Z': '#996633',
  'L': '#A7A9AC',
  'N': '#FCCC0A', 'Q': '#FCCC0A', 'R': '#FCCC0A', 'W': '#FCCC0A',
  'S': '#808183', 'GS': '#808183', 'FS': '#808183',
};

const createShowMarkerIcon = (color: string) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="24" height="36">
    <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24C24 5.4 18.6 0 12 0z" fill="${color}" stroke="#1e293b" stroke-width="1.5"/>
    <circle cx="12" cy="12" r="5" fill="#1e293b" opacity="0.6"/>
  </svg>`;
  return L.divIcon({
    html: svg,
    className: 'leaflet-marker-custom',
    iconSize: [24, 36],
    iconAnchor: [12, 36],
    popupAnchor: [0, -36],
  });
};

const formatShowDateTime = (dateStr: string, timeStr: string): string => {
  try {
    const date = parseISO(dateStr);
    const day = format(date, 'EEE, MMM d');
    // Trim seconds from time strings like "20:00:00"
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

const buildVenuePopupHtml = (venueName: string, shows: AudienceShow[]): string => {
  const rows = shows
    .map((show, i) => {
      const dateTime = formatShowDateTime(show.show_date, show.show_time);
      const price = formatPrice(show);
      const ticketUrl = show.external_ticket_url || show.ticket_url;
      const isLast = i === shows.length - 1;

      const typeTag = show.show_type
        ? `<span style="font-size:10px;text-transform:uppercase;letter-spacing:0.06em;color:#64748b;">${show.show_type}</span><br/>`
        : '';
      const priceTag = price
        ? `<div style="color:#f97316;font-size:11px;font-weight:600;margin-top:2px;">${price}</div>`
        : '';
      const ticketBtn = ticketUrl
        ? `<a href="${ticketUrl}" target="_blank" rel="noopener noreferrer"
             style="display:inline-block;margin-top:5px;padding:3px 12px;background:#f97316;color:#fff;border-radius:4px;font-size:11px;font-weight:600;text-decoration:none;">
             Get Tickets →
           </a>`
        : '';
      const border = isLast ? '' : 'border-bottom:1px solid #e2e8f0;margin-bottom:8px;';

      return `<div style="padding-bottom:6px;${border}">
        ${typeTag}
        <div style="font-weight:700;font-size:13px;color:#0f172a;line-height:1.3;">${show.title}</div>
        <div style="color:#475569;font-size:11px;margin-top:2px;">${dateTime}</div>
        ${priceTag}
        ${ticketBtn}
      </div>`;
    })
    .join('');

  return `<div style="min-width:200px;max-width:250px;max-height:300px;overflow-y:auto;">
    <div style="font-weight:700;font-size:14px;color:#0f172a;border-bottom:1px solid #e2e8f0;padding-bottom:6px;margin-bottom:8px;">${venueName}</div>
    ${rows}
  </div>`;
};

// Inner component that attaches markers to the map
const ShowMarkersLayer: React.FC<{
  venueGroups: VenueGroup[];
  geocodingService: GeocodingService;
  onProgress: (p: GeocodingProgress | null) => void;
  onLoading: (v: boolean) => void;
  onCount: (n: number) => void;
  onVenueClick: (venueName: string, shows: AudienceShow[]) => void;
}> = ({ venueGroups, geocodingService, onProgress, onLoading, onCount, onVenueClick }) => {
  const map = useMap();
  const clusterRef = useRef<L.MarkerClusterGroup | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      onLoading(true);

      if (clusterRef.current) {
        map.removeLayer(clusterRef.current);
        clusterRef.current = null;
      }

      const cluster = L.markerClusterGroup({
        maxClusterRadius: 50,
        spiderfyOnMaxZoom: true,
        showCoverageOnHover: false,
        zoomToBoundsOnClick: true,
        disableClusteringAtZoom: 16,
        iconCreateFunction: (c) => {
          const count = c.getChildCount();
          const px = count >= 50 ? 48 : count >= 10 ? 42 : 36;
          const size = count >= 50 ? 'large' : count >= 10 ? 'medium' : 'small';
          return L.divIcon({
            html: `<div class="cluster-icon cluster-${size}"><span>${count}</span></div>`,
            className: 'marker-cluster-custom',
            iconSize: L.point(px, px),
          });
        },
      });

      const addresses = venueGroups.map((g) => g.key);
      const coordsMap = await geocodingService.geocodeAddresses(addresses, (p) => {
        if (!cancelled) onProgress(p);
      });

      if (cancelled) return;

      let count = 0;
      venueGroups.forEach((group) => {
        const coords = coordsMap.get(group.key);
        if (!coords) return;
        const [lng, lat] = coords;

        const color = getShowTypeColor(group.shows[0]?.show_type ?? null);
        const icon = createShowMarkerIcon(color);
        const marker = L.marker([lat, lng], { icon });
        marker.on('click', () => onVenueClick(group.venueName, group.shows));
        cluster.addLayer(marker);
        count++;
      });

      map.addLayer(cluster);
      clusterRef.current = cluster;
      onCount(count);
      onLoading(false);
      onProgress(null);
    };

    load();

    return () => {
      cancelled = true;
      if (clusterRef.current) {
        map.removeLayer(clusterRef.current);
        clusterRef.current = null;
      }
    };
  }, [venueGroups, geocodingService, map]);

  return null;
};

const ZoomControlTopRight = () => {
  const map = useMap();
  useEffect(() => {
    const zc = L.control.zoom({ position: 'topright' });
    zc.addTo(map);
    return () => { zc.remove(); };
  }, [map]);
  return null;
};

const SubwayLayer: React.FC = () => {
  const map = useMap();
  const routeLayerRef = useRef<L.LayerGroup | null>(null);
  const dotLayerRef = useRef<L.LayerGroup | null>(null);
  const badgeLayerRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    const routeLayer = L.layerGroup();
    const dotLayer = L.layerGroup();
    const badgeLayer = L.layerGroup();
    routeLayerRef.current = routeLayer;
    dotLayerRef.current = dotLayer;
    badgeLayerRef.current = badgeLayer;
    let cancelled = false;

    const updateVisibility = () => {
      const zoom = map.getZoom();
      // Route lines: always visible
      if (!map.hasLayer(routeLayer)) routeLayer.addTo(map);
      // Dot markers: zoom 14–15
      if (zoom >= 14 && zoom < 16) {
        if (!map.hasLayer(dotLayer)) dotLayer.addTo(map);
        map.removeLayer(badgeLayer);
      } else if (zoom >= 16) {
        map.removeLayer(dotLayer);
        if (!map.hasLayer(badgeLayer)) badgeLayer.addTo(map);
      } else {
        map.removeLayer(dotLayer);
        map.removeLayer(badgeLayer);
      }
    };

    const loadRoutes = async () => {
      const query = `[out:json];rel["network"="NYC Subway"]["type"="route"](40.4,-74.3,40.9,-73.7);out body geom;`;
      const res = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (cancelled) return;

      data.elements.forEach((rel: any) => {
        if (rel.type !== 'relation') return;
        const ref = rel.tags?.ref || '';
        const colour = rel.tags?.colour || SUBWAY_LINE_COLORS[ref] || '#808183';

        rel.members?.forEach((member: any) => {
          if (member.type !== 'way' || !member.geometry?.length) return;
          const latlngs = member.geometry.map((pt: any) => [pt.lat, pt.lon] as [number, number]);
          if (latlngs.length < 2) return;
          L.polyline(latlngs, { color: colour, weight: 3, opacity: 0.85 }).addTo(routeLayer);
        });
      });
    };

    const loadStations = async () => {
      const res = await fetch(
        'https://data.ny.gov/resource/i9wp-a4ja.json?$limit=2500&$select=station_id,stop_name,daytime_routes,entrance_latitude,entrance_longitude'
      );
      const entrances = await res.json();
      if (cancelled) return;

      const seen = new Set<string>();
      const stations = entrances.filter((e: any) => {
        if (!e.station_id || seen.has(e.station_id)) return false;
        seen.add(e.station_id);
        return true;
      });

      stations.forEach((station: any) => {
        const lat = parseFloat(station.entrance_latitude);
        const lng = parseFloat(station.entrance_longitude);
        if (isNaN(lat) || isNaN(lng)) return;
        const lines = (station.daytime_routes || '').split(' ').map((l: string) => l.trim()).filter(Boolean);
        const dotColor = SUBWAY_LINE_COLORS[lines[0]] || '#808183';

        const badges = lines.map((line: string) => {
          const color = SUBWAY_LINE_COLORS[line] || '#808183';
          const textColor = ['N', 'Q', 'R', 'W'].includes(line) ? '#000' : '#fff';
          return `<span style="display:inline-flex;align-items:center;justify-content:center;width:15px;height:15px;border-radius:50%;background:${color};color:${textColor};font-size:8px;font-weight:700;margin:0 1px;">${line}</span>`;
        }).join('');

        // Simple dot for zoom 12–15
        const dotIcon = L.divIcon({
          html: `<div style="width:7px;height:7px;border-radius:50%;background:${dotColor};border:1.5px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,0.5);"></div>`,
          className: '',
          iconSize: [7, 7],
          iconAnchor: [3, 3],
          popupAnchor: [0, -6],
        });
        L.marker([lat, lng], { icon: dotIcon })
          .bindPopup(`<div style="font-size:12px;font-weight:600;color:#0f172a;">${station.stop_name}</div>`, { className: 'dark-popup', maxWidth: 200 })
          .addTo(dotLayer);

        // Badge marker for zoom 16+
        const width = Math.max(lines.length * 17, 17);
        const badgeIcon = L.divIcon({
          html: `<div style="display:flex;align-items:center;">${badges}</div>`,
          className: 'subway-marker',
          iconSize: [width, 15],
          iconAnchor: [width / 2, 7],
          popupAnchor: [0, -10],
        });
        L.marker([lat, lng], { icon: badgeIcon })
          .bindPopup(
            `<div style="font-size:12px;font-weight:600;color:#0f172a;">${station.stop_name}</div>
             <div style="margin-top:4px;display:flex;flex-wrap:wrap;gap:2px;">${badges}</div>`,
            { className: 'dark-popup', maxWidth: 200 }
          )
          .addTo(badgeLayer);
      });
    };

    const init = async () => {
      try {
        await Promise.all([loadRoutes(), loadStations()]);
        updateVisibility();
      } catch (err) {
        console.warn('Failed to load subway data:', err);
      }
    };

    map.on('zoomend', updateVisibility);
    init();

    return () => {
      cancelled = true;
      map.off('zoomend', updateVisibility);
      [routeLayerRef.current, dotLayerRef.current, badgeLayerRef.current].forEach(l => {
        if (l) map.removeLayer(l);
      });
    };
  }, [map]);

  return null;
};

const CitiBikeLayer: React.FC = () => {
  const map = useMap();
  const layerRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    const layer = L.layerGroup();
    layerRef.current = layer;
    let cancelled = false;

    const updateVisibility = () => {
      if (!layerRef.current) return;
      if (map.getZoom() >= 16) {
        if (!map.hasLayer(layerRef.current)) layerRef.current.addTo(map);
      } else {
        map.removeLayer(layerRef.current);
      }
    };

    const load = async () => {
      try {
        const res = await fetch('https://gbfs.citibikenyc.com/gbfs/en/station_information.json');
        const json = await res.json();
        if (cancelled) return;
        const stations = json.data?.stations || [];

        const icon = L.divIcon({
          html: `<div style="width:6px;height:6px;border-radius:50%;background:#0ea5e9;border:1px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,0.4);"></div>`,
          className: 'citibike-marker',
          iconSize: [6, 6],
          iconAnchor: [3, 3],
          popupAnchor: [0, -8],
        });

        stations.forEach((station: any) => {
          if (!station.lat || !station.lon) return;
          const marker = L.marker([station.lat, station.lon], { icon });
          marker.bindPopup(
            `<div style="font-size:12px;font-weight:600;color:#0f172a;">🚲 ${station.name}</div>
             <div style="font-size:11px;color:#475569;margin-top:2px;">${station.capacity} docks</div>`,
            { className: 'dark-popup', maxWidth: 200 }
          );
          layer.addLayer(marker);
        });

        updateVisibility();
      } catch (err) {
        console.warn('Failed to load Citi Bike stations:', err);
      }
    };

    map.on('zoomend', updateVisibility);
    load();

    return () => {
      cancelled = true;
      map.off('zoomend', updateVisibility);
      if (layerRef.current) map.removeLayer(layerRef.current);
    };
  }, [map]);

  return null;
};

const AudienceShowsMap: React.FC<AudienceShowsMapProps> = ({ shows }) => {
  const geocodingService = useRef<GeocodingService | null>(null);
  const [serviceReady, setServiceReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState<GeocodingProgress | null>(null);
  const [loadedCount, setLoadedCount] = useState(0);
  const [bottomSheet, setBottomSheet] = useState<{ venueName: string; shows: AudienceShow[] } | null>(null);

  useEffect(() => {
    getMapboxToken().then((token) => {
      if (token) geocodingService.current = new GeocodingService(token);
      setServiceReady(true);
    });
  }, []);

  // Group shows by venue address
  const venueGroups = useMemo<VenueGroup[]>(() => {
    const map = new Map<string, VenueGroup>();
    for (const show of shows) {
      const key = show.venue_address?.trim() || `${show.venue_name}, New York, NY`;
      if (!map.has(key)) {
        map.set(key, { key, venueName: show.venue_name, shows: [] });
      }
      map.get(key)!.shows.push(show);
    }
    return Array.from(map.values());
  }, [shows]);

  const defaultCenter: [number, number] = [40.7308, -73.9352]; // NYC

  return (
    <div className="relative w-full h-full">
      {/* Legend */}
      <div className="hidden md:block absolute top-3 left-3 z-[1000] bg-black/70 backdrop-blur-sm rounded-lg px-3 py-2 text-xs space-y-1">
        {SHOW_TYPE_COLORS.map(({ label, color }) => (
          <div key={label} className="flex items-center gap-2">
            <span
              className="inline-block w-3 h-3 rounded-full border border-slate-600 flex-shrink-0"
              style={{ backgroundColor: color }}
            />
            <span className="text-slate-300">{label}</span>
          </div>
        ))}
        <div className="border-t border-slate-700 pt-1 mt-1 space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-block w-3 h-3 rounded-full bg-sky-500 border border-slate-600 flex-shrink-0" />
            <span className="text-slate-400">Citi Bike (zoom 16+)</span>
          </div>
          <div className="text-slate-500 text-[9px]">Subway lines always · stations at 14+ · service at 16+</div>
        </div>
      </div>

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute top-3 right-12 z-[1000] bg-black/70 backdrop-blur-sm rounded-lg px-3 py-2 text-xs text-slate-300">
          {progress
            ? `Locating venues… ${progress.current}/${progress.total}`
            : 'Loading shows…'}
        </div>
      )}

      {/* Show count badge */}
      {!isLoading && loadedCount > 0 && (
        <div className="absolute bottom-8 left-3 z-[1000] bg-black/70 backdrop-blur-sm rounded-lg px-3 py-1.5 text-xs text-slate-300">
          {loadedCount} venue{loadedCount !== 1 ? 's' : ''} · next 5 days
        </div>
      )}

      {bottomSheet && (
        <>
          <div className="absolute inset-0 z-[1001]" onClick={() => setBottomSheet(null)} />
          <div className="absolute bottom-0 left-0 right-0 z-[1002] bg-white rounded-t-2xl shadow-2xl flex flex-col max-h-[65vh]">
            <div className="flex justify-center pt-2 pb-1 flex-shrink-0">
              <div className="w-10 h-1 rounded-full bg-slate-300" />
            </div>
            <div className="flex items-center justify-between px-4 py-2 border-b border-slate-100 flex-shrink-0">
              <h2 className="font-bold text-base text-slate-900 truncate pr-2">{bottomSheet.venueName}</h2>
              <button
                onClick={() => setBottomSheet(null)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none flex-shrink-0"
              >✕</button>
            </div>
            <div className="overflow-y-auto flex-1 px-4 py-3 space-y-4">
              {bottomSheet.shows.map((show, i) => {
                const dateTime = formatShowDateTime(show.show_date, show.show_time);
                const price = formatPrice(show);
                const ticketUrl = show.external_ticket_url || show.ticket_url;
                return (
                  <div key={i} className={`pb-3 ${i < bottomSheet.shows.length - 1 ? 'border-b border-slate-100' : ''}`}>
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

      <MapContainer
        center={defaultCenter}
        zoom={11}
        maxZoom={18}
        minZoom={10}
        preferCanvas={true}
        className="h-full w-full z-0"
        zoomControl={false}
        attributionControl={true}
      >
        <TileLayer url={CARTO_DARK_URL} attribution={CARTO_ATTRIBUTION} subdomains="abcd" />
        <ZoomControlTopRight />
        <SubwayLayer />
        <CitiBikeLayer />
        {serviceReady && geocodingService.current && (
          <ShowMarkersLayer
            venueGroups={venueGroups}
            geocodingService={geocodingService.current}
            onProgress={setProgress}
            onLoading={setIsLoading}
            onCount={setLoadedCount}
            onVenueClick={(venueName, shows) => setBottomSheet({ venueName, shows })}
          />
        )}
      </MapContainer>
    </div>
  );
};

export default AudienceShowsMap;
