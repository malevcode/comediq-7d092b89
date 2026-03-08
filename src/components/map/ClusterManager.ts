import maplibregl from 'maplibre-gl';
import { OpenMic } from '@/types/openMic';
import { formatTimeShort, getMicLiveStatus } from './MapUtils';

export interface MicFeature {
  type: 'Feature';
  geometry: {
    type: 'Point';
    coordinates: [number, number];
  };
  properties: {
    id: string;
    name: string;
    venueName: string;
    startTime: string;
    endTime: string;
    cost: string;
    stageTime: string;
    status: string;
    borough: string;
    neighborhood: string;
    day: string;
    isFree: boolean;
    timeLabel: string;
    liveStatus: string;
  };
}

const SOURCE_ID = 'mics-source';
const CLUSTER_LAYER = 'clusters';
const CLUSTER_COUNT_LAYER = 'cluster-count';
const UNCLUSTERED_LAYER = 'unclustered-mic';
const UNCLUSTERED_LABEL_LAYER = 'unclustered-label';
const ROUTE_SOURCE_ID = 'route-source';
const ROUTE_LAYER = 'route-line';

interface SpiderLeg {
  marker: maplibregl.Marker;
  mic: OpenMic;
}

export class ClusterManager {
  private map: maplibregl.Map;
  private micLookup: Map<string, OpenMic> = new Map();
  private coordsLookup: Map<string, [number, number]> = new Map();
  private userLocation: [number, number] | null = null;
  private onMicSelect?: (mic: OpenMic, coords: [number, number] | null) => void;
  private spiderLegs: SpiderLeg[] = [];
  private layersAdded = false;

  constructor(map: maplibregl.Map) {
    this.map = map;
  }

  public setMicSelectCallback(cb: (mic: OpenMic, coords: [number, number] | null) => void) {
    this.onMicSelect = cb;
  }

  public setUserLocation(loc: [number, number] | null) {
    this.userLocation = loc;
  }

  public getCoordsForMic(micId: string): [number, number] | null {
    return this.coordsLookup.get(micId) || null;
  }

  private toGeoJSON(mics: MicFeature[]): GeoJSON.FeatureCollection {
    return { type: 'FeatureCollection', features: mics };
  }

  public micToFeature(mic: OpenMic, coords: [number, number]): MicFeature {
    const liveStatus = getMicLiveStatus(mic.day, mic.startTime, mic.latestEndTime);
    const timeLabel = (liveStatus === 'live' || liveStatus === 'soon')
      ? (liveStatus === 'live' ? 'LIVE' : 'SOON')
      : formatTimeShort(mic.startTime);

    return {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: coords },
      properties: {
        id: mic.uniqueIdentifier,
        name: mic.openMic,
        venueName: mic.venueName,
        startTime: mic.startTime,
        endTime: mic.latestEndTime,
        cost: mic.cost,
        stageTime: mic.stageTime,
        status: mic.status ?? 'verified',
        borough: mic.borough,
        neighborhood: mic.neighborhood,
        day: mic.day,
        isFree: mic.cost?.toLowerCase().includes('free') ?? false,
        timeLabel,
        liveStatus,
      },
    };
  }

  public setupLayers() {
    if (this.layersAdded) return;

    this.map.addSource(SOURCE_ID, {
      type: 'geojson',
      data: this.toGeoJSON([]),
      cluster: true,
      clusterMaxZoom: 14,
      clusterRadius: 50,
    });

    this.map.addSource(ROUTE_SOURCE_ID, {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
    });

    // Route dashed line
    this.map.addLayer({
      id: ROUTE_LAYER,
      type: 'line',
      source: ROUTE_SOURCE_ID,
      paint: {
        'line-color': '#22d3ee',
        'line-width': 2.5,
        'line-dasharray': [3, 3],
        'line-opacity': 0.7,
      },
      layout: {
        'line-join': 'round',
        'line-cap': 'round',
      },
    });

    // Cluster circles – dark with neon border
    this.map.addLayer({
      id: CLUSTER_LAYER,
      type: 'circle',
      source: SOURCE_ID,
      filter: ['has', 'point_count'],
      paint: {
        'circle-color': '#111827',
        'circle-radius': ['step', ['get', 'point_count'], 20, 10, 26, 30, 32],
        'circle-stroke-width': 2,
        'circle-stroke-color': '#22d3ee',
      },
    });

    // Cluster count labels – neon cyan
    this.map.addLayer({
      id: CLUSTER_COUNT_LAYER,
      type: 'symbol',
      source: SOURCE_ID,
      filter: ['has', 'point_count'],
      layout: {
        'text-field': '{point_count_abbreviated}',
        'text-font': ['Open Sans Bold'],
        'text-size': 13,
        'text-allow-overlap': true,
      },
      paint: {
        'text-color': '#22d3ee',
      },
    });

    // Individual mic pins – dark pill markers
    this.map.addLayer({
      id: UNCLUSTERED_LAYER,
      type: 'circle',
      source: SOURCE_ID,
      filter: ['!', ['has', 'point_count']],
      paint: {
        'circle-color': '#111827',
        'circle-radius': [
          'match', ['get', 'liveStatus'],
          'live', 11,
          'soon', 10,
          9,
        ],
        'circle-stroke-width': 2,
        'circle-stroke-color': [
          'match', ['get', 'liveStatus'],
          'live', '#22c55e',
          'soon', '#22c55e',
          'today', '#f97316',
          [
            'match', ['get', 'status'],
            'verified', '#818cf8',
            'trial', '#fbbf24',
            '#6b7280',
          ],
        ],
      },
    });

    // Neon time label on each pin
    this.map.addLayer({
      id: UNCLUSTERED_LABEL_LAYER,
      type: 'symbol',
      source: SOURCE_ID,
      filter: ['!', ['has', 'point_count']],
      layout: {
        'text-field': ['get', 'timeLabel'],
        'text-font': ['Open Sans Bold'],
        'text-size': [
          'match', ['get', 'liveStatus'],
          'live', 9,
          'soon', 9,
          10,
        ],
        'text-offset': [0, 0],
        'text-allow-overlap': false,
        'icon-allow-overlap': false,
      },
      paint: {
        'text-color': [
          'match', ['get', 'liveStatus'],
          'live', '#4ade80',
          'soon', '#4ade80',
          'today', '#fb923c',
          '#e2e8f0',
        ],
        'text-halo-color': '#111827',
        'text-halo-width': 1,
      },
    });

    // Event handlers
    this.map.on('click', CLUSTER_LAYER, (e) => this.handleClusterClick(e));
    this.map.on('click', UNCLUSTERED_LAYER, (e) => this.handlePinClick(e));
    this.map.on('mouseenter', UNCLUSTERED_LAYER, () => { this.map.getCanvas().style.cursor = 'pointer'; });
    this.map.on('mouseleave', UNCLUSTERED_LAYER, () => { this.map.getCanvas().style.cursor = ''; });
    this.map.on('mouseenter', CLUSTER_LAYER, () => { this.map.getCanvas().style.cursor = 'pointer'; });
    this.map.on('mouseleave', CLUSTER_LAYER, () => { this.map.getCanvas().style.cursor = ''; });

    this.map.on('click', (e) => {
      const features = this.map.queryRenderedFeatures(e.point, { layers: [CLUSTER_LAYER, UNCLUSTERED_LAYER] });
      if (features.length === 0) {
        this.clearSpider();
      }
    });

    this.layersAdded = true;
  }

  public updateData(features: MicFeature[], micLookup: Map<string, OpenMic>) {
    this.micLookup = micLookup;
    this.coordsLookup.clear();
    for (const f of features) {
      this.coordsLookup.set(f.properties.id, f.geometry.coordinates as [number, number]);
    }
    const source = this.map.getSource(SOURCE_ID) as maplibregl.GeoJSONSource | undefined;
    if (source) {
      source.setData(this.toGeoJSON(features));
    }
  }

  public updateRouteLine(orderedCoords: [number, number][]) {
    const source = this.map.getSource(ROUTE_SOURCE_ID) as maplibregl.GeoJSONSource | undefined;
    if (!source) return;

    if (orderedCoords.length < 2) {
      source.setData({ type: 'FeatureCollection', features: [] });
      return;
    }

    source.setData({
      type: 'FeatureCollection',
      features: [{
        type: 'Feature',
        geometry: { type: 'LineString', coordinates: orderedCoords },
        properties: {},
      }],
    });
  }

  private handleClusterClick(e: maplibregl.MapLayerMouseEvent) {
    const features = this.map.queryRenderedFeatures(e.point, { layers: [CLUSTER_LAYER] });
    if (!features.length) return;

    const clusterId = features[0].properties?.cluster_id;
    const source = this.map.getSource(SOURCE_ID) as maplibregl.GeoJSONSource;

    source.getClusterExpansionZoom(clusterId).then((zoom) => {
      const currentZoom = this.map.getZoom();
      if (zoom !== undefined && zoom !== null && (zoom <= currentZoom + 1 || currentZoom >= 14)) {
        this.spiderfy(clusterId, features[0] as any);
      } else {
        const coords = (features[0].geometry as any).coordinates.slice();
        this.map.easeTo({ center: coords, zoom: zoom ?? currentZoom + 2 });
      }
    });
  }

  private spiderfy(clusterId: number, clusterFeature: any) {
    this.clearSpider();
    const source = this.map.getSource(SOURCE_ID) as maplibregl.GeoJSONSource;
    const center = (clusterFeature.geometry as any).coordinates as [number, number];

    source.getClusterLeaves(clusterId, 100, 0).then((leaves) => {
      if (!leaves) return;

      const count = leaves.length;
      const angleStep = (2 * Math.PI) / count;
      const radius = 0.0004 + count * 0.00003;

      leaves.forEach((leaf: any, i: number) => {
        const angle = i * angleStep - Math.PI / 2;
        const lng = center[0] + radius * Math.cos(angle);
        const lat = center[1] + radius * Math.sin(angle);
        const props = leaf.properties;
        const mic = this.micLookup.get(props.id);
        if (!mic) return;

        const liveStatus = props.liveStatus || 'other';
        const borderColor = liveStatus === 'live' || liveStatus === 'soon'
          ? '#22c55e'
          : liveStatus === 'today'
          ? '#f97316'
          : props.status === 'verified' ? '#818cf8'
          : props.status === 'trial' ? '#fbbf24' : '#6b7280';

        const el = document.createElement('div');
        el.className = 'spider-leg-pin';
        el.style.cssText = `
          width: 18px; height: 18px; border-radius: 50%;
          background: #111827; border: 2px solid ${borderColor};
          box-shadow: 0 0 8px ${borderColor}40; cursor: pointer;
          transition: transform 0.15s;
        `;
        el.addEventListener('mouseenter', () => { el.style.transform = 'scale(1.3)'; });
        el.addEventListener('mouseleave', () => { el.style.transform = 'scale(1)'; });

        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([lng, lat])
          .addTo(this.map);

        el.addEventListener('click', (ev) => {
          ev.stopPropagation();
          const micCoords = this.coordsLookup.get(mic.uniqueIdentifier) || null;
          this.onMicSelect?.(mic, micCoords);
        });

        this.spiderLegs.push({ marker, mic });
      });
    });
  }

  public clearSpider() {
    this.spiderLegs.forEach(({ marker }) => marker.remove());
    this.spiderLegs = [];
  }

  private handlePinClick(e: maplibregl.MapLayerMouseEvent) {
    if (!e.features?.length) return;
    const id = e.features[0].properties?.id;
    const mic = this.micLookup.get(id);
    if (mic) {
      const coords = this.coordsLookup.get(id) || null;
      this.onMicSelect?.(mic, coords);
    }
  }

  private userMarker: maplibregl.Marker | null = null;

  public addUserLocationMarker(coords: [number, number]) {
    if (this.userMarker) this.userMarker.remove();

    const el = document.createElement('div');
    el.style.cssText = `
      width: 14px; height: 14px; border-radius: 50%;
      background: #3b82f6; border: 3px solid #1e293b;
      box-shadow: 0 0 0 3px rgba(59,130,246,0.4), 0 0 12px rgba(59,130,246,0.3);
    `;

    this.userMarker = new maplibregl.Marker({ element: el })
      .setLngLat(coords)
      .addTo(this.map);
  }

  public destroy() {
    this.clearSpider();
    if (this.userMarker) this.userMarker.remove();
  }
}
