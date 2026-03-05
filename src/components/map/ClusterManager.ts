import mapboxgl from 'mapbox-gl';
import { OpenMic } from '@/types/openMic';
import { formatTime, formatCost, formatStageTime, calculateDistance, formatDistance } from './MapUtils';

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
    costLabel: string;
  };
}

const SOURCE_ID = 'mics-source';
const CLUSTER_LAYER = 'clusters';
const CLUSTER_COUNT_LAYER = 'cluster-count';
const UNCLUSTERED_LAYER = 'unclustered-mic';
const UNCLUSTERED_LABEL_LAYER = 'unclustered-label';

// Spider state
interface SpiderLeg {
  marker: mapboxgl.Marker;
  mic: OpenMic;
}

export class ClusterManager {
  private map: mapboxgl.Map;
  private micLookup: Map<string, OpenMic> = new Map();
  private userLocation: [number, number] | null = null;
  private onMicSelect?: (mic: OpenMic) => void;
  private spiderLegs: SpiderLeg[] = [];
  private popup: mapboxgl.Popup | null = null;
  private layersAdded = false;

  constructor(map: mapboxgl.Map) {
    this.map = map;
  }

  public setMicSelectCallback(cb: (mic: OpenMic) => void) {
    this.onMicSelect = cb;
  }

  public setUserLocation(loc: [number, number] | null) {
    this.userLocation = loc;
  }

  // ── Convert mics to GeoJSON ──────────────────────────────────────
  private toGeoJSON(mics: MicFeature[]): GeoJSON.FeatureCollection {
    return { type: 'FeatureCollection', features: mics };
  }

  public micToFeature(mic: OpenMic, coords: [number, number]): MicFeature {
    const costStr = mic.cost?.toLowerCase() ?? '';
    const isFree = costStr.includes('free');
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
        isFree,
        costLabel: isFree ? 'Free' : formatCost(mic.cost),
      },
    };
  }

  // ── Setup source + layers (call once after style loads) ──────────
  public setupLayers() {
    if (this.layersAdded) return;

    // Add empty source
    this.map.addSource(SOURCE_ID, {
      type: 'geojson',
      data: this.toGeoJSON([]),
      cluster: true,
      clusterMaxZoom: 14,
      clusterRadius: 50,
    });

    // ── Cluster circles ────────────────────────────────────────────
    this.map.addLayer({
      id: CLUSTER_LAYER,
      type: 'circle',
      source: SOURCE_ID,
      filter: ['has', 'point_count'],
      paint: {
        'circle-color': [
          'step', ['get', 'point_count'],
          '#51bbd6', 10,
          '#f1f075', 30,
          '#f28cb1',
        ],
        'circle-radius': ['step', ['get', 'point_count'], 18, 10, 24, 30, 30],
        'circle-stroke-width': 2,
        'circle-stroke-color': '#fff',
      },
    });

    // ── Cluster count labels ───────────────────────────────────────
    this.map.addLayer({
      id: CLUSTER_COUNT_LAYER,
      type: 'symbol',
      source: SOURCE_ID,
      filter: ['has', 'point_count'],
      layout: {
        'text-field': '{point_count_abbreviated}',
        'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
        'text-size': 13,
        'text-allow-overlap': true,
      },
      paint: {
        'text-color': '#1a1a2e',
      },
    });

    // ── Individual mic pins ────────────────────────────────────────
    this.map.addLayer({
      id: UNCLUSTERED_LAYER,
      type: 'circle',
      source: SOURCE_ID,
      filter: ['!', ['has', 'point_count']],
      paint: {
        'circle-color': [
          'match', ['get', 'status'],
          'verified', '#22c55e',   // green
          'trial',    '#f59e0b',   // amber
          /* default */ '#9ca3af', // gray
        ],
        'circle-radius': 8,
        'circle-stroke-width': 2,
        'circle-stroke-color': '#fff',
      },
    });

    // ── Cost label on each pin ─────────────────────────────────────
    this.map.addLayer({
      id: UNCLUSTERED_LABEL_LAYER,
      type: 'symbol',
      source: SOURCE_ID,
      filter: ['!', ['has', 'point_count']],
      layout: {
        'text-field': ['get', 'costLabel'],
        'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
        'text-size': 9,
        'text-offset': [0, 1.8],
        'text-allow-overlap': false,
        'icon-allow-overlap': false,
      },
      paint: {
        'text-color': '#374151',
        'text-halo-color': '#ffffff',
        'text-halo-width': 1,
      },
    });

    // ── Event handlers ─────────────────────────────────────────────
    this.map.on('click', CLUSTER_LAYER, (e) => this.handleClusterClick(e));
    this.map.on('click', UNCLUSTERED_LAYER, (e) => this.handlePinClick(e));
    this.map.on('mouseenter', UNCLUSTERED_LAYER, (e) => this.handlePinHover(e));
    this.map.on('mouseleave', UNCLUSTERED_LAYER, () => this.removePopup());
    this.map.on('mouseenter', CLUSTER_LAYER, () => { this.map.getCanvas().style.cursor = 'pointer'; });
    this.map.on('mouseleave', CLUSTER_LAYER, () => { this.map.getCanvas().style.cursor = ''; });

    // Close spider on map click (not on pin/cluster)
    this.map.on('click', (e) => {
      // If the click was on a cluster or pin layer, those handlers fire first
      const features = this.map.queryRenderedFeatures(e.point, { layers: [CLUSTER_LAYER, UNCLUSTERED_LAYER] });
      if (features.length === 0) {
        this.clearSpider();
      }
    });

    this.layersAdded = true;
  }

  // ── Update data ──────────────────────────────────────────────────
  public updateData(features: MicFeature[], micLookup: Map<string, OpenMic>) {
    this.micLookup = micLookup;
    const source = this.map.getSource(SOURCE_ID) as mapboxgl.GeoJSONSource | undefined;
    if (source) {
      source.setData(this.toGeoJSON(features));
    }
  }

  // ── Cluster click → zoom or spider ──────────────────────────────
  private handleClusterClick(e: mapboxgl.MapLayerMouseEvent) {
    const features = this.map.queryRenderedFeatures(e.point, { layers: [CLUSTER_LAYER] });
    if (!features.length) return;

    const clusterId = features[0].properties?.cluster_id;
    const source = this.map.getSource(SOURCE_ID) as mapboxgl.GeoJSONSource;

    source.getClusterExpansionZoom(clusterId, (err, zoom) => {
      if (err) return;

      const currentZoom = this.map.getZoom();
      // If already at or near max cluster zoom, spiderfy instead of zooming
      if (zoom !== undefined && zoom !== null && (zoom <= currentZoom + 1 || currentZoom >= 14)) {
        this.spiderfy(clusterId, features[0] as any);
      } else {
        const coords = (features[0].geometry as any).coordinates.slice();
        this.map.easeTo({ center: coords, zoom: zoom ?? currentZoom + 2 });
      }
    });
  }

  // ── Spiderfication ───────────────────────────────────────────────
  private spiderfy(clusterId: number, clusterFeature: any) {
    this.clearSpider();
    const source = this.map.getSource(SOURCE_ID) as mapboxgl.GeoJSONSource;
    const center = (clusterFeature.geometry as any).coordinates as [number, number];

    source.getClusterLeaves(clusterId, 100, 0, (err, leaves) => {
      if (err || !leaves) return;

      const count = leaves.length;
      const angleStep = (2 * Math.PI) / count;
      const radius = 0.0004 + count * 0.00003; // adaptive radius

      leaves.forEach((leaf: any, i: number) => {
        const angle = i * angleStep - Math.PI / 2;
        const lng = center[0] + radius * Math.cos(angle);
        const lat = center[1] + radius * Math.sin(angle);
        const props = leaf.properties;
        const mic = this.micLookup.get(props.id);
        if (!mic) return;

        const statusColor = props.status === 'verified' ? '#22c55e' : props.status === 'trial' ? '#f59e0b' : '#9ca3af';

        // Create a small pin element
        const el = document.createElement('div');
        el.className = 'spider-leg-pin';
        el.style.cssText = `
          width: 16px; height: 16px; border-radius: 50%;
          background: ${statusColor}; border: 2px solid #fff;
          box-shadow: 0 1px 4px rgba(0,0,0,0.3); cursor: pointer;
          transition: transform 0.15s;
        `;
        el.addEventListener('mouseenter', () => { el.style.transform = 'scale(1.3)'; });
        el.addEventListener('mouseleave', () => { el.style.transform = 'scale(1)'; });

        const marker = new mapboxgl.Marker({ element: el })
          .setLngLat([lng, lat])
          .addTo(this.map);

        // Click → open detail
        el.addEventListener('click', (ev) => {
          ev.stopPropagation();
          this.onMicSelect?.(mic);
        });

        // Hover → popup
        el.addEventListener('mouseenter', () => {
          this.showPopup([lng, lat], mic);
        });
        el.addEventListener('mouseleave', () => {
          this.removePopup();
        });

        // Draw a line from center to spider leg
        this.spiderLegs.push({ marker, mic });
      });
    });
  }

  public clearSpider() {
    this.spiderLegs.forEach(({ marker }) => marker.remove());
    this.spiderLegs = [];
  }

  // ── Pin click → open modal ──────────────────────────────────────
  private handlePinClick(e: mapboxgl.MapLayerMouseEvent) {
    if (!e.features?.length) return;
    const id = e.features[0].properties?.id;
    const mic = this.micLookup.get(id);
    if (mic) {
      this.removePopup();
      this.onMicSelect?.(mic);
    }
  }

  // ── Pin hover → smart popup ─────────────────────────────────────
  private handlePinHover(e: mapboxgl.MapLayerMouseEvent) {
    if (!e.features?.length) return;
    this.map.getCanvas().style.cursor = 'pointer';
    const props = e.features[0].properties!;
    const coords = (e.features[0].geometry as any).coordinates.slice() as [number, number];
    const mic = this.micLookup.get(props.id);
    if (mic) this.showPopup(coords, mic);
  }

  private showPopup(coords: [number, number], mic: OpenMic) {
    this.removePopup();

    let distanceHtml = '';
    if (this.userLocation) {
      const [uLng, uLat] = this.userLocation;
      const dist = calculateDistance(uLat, uLng, coords[1], coords[0]);
      distanceHtml = `<p style="margin:2px 0;font-size:12px;color:#2563eb;font-weight:500;">📍 ${formatDistance(dist)} away</p>`;
    }

    const statusColor = mic.status === 'verified' ? '#22c55e' : mic.status === 'trial' ? '#f59e0b' : '#9ca3af';
    const statusLabel = mic.status === 'verified' ? 'Verified' : mic.status === 'trial' ? 'Trial' : 'Legacy';

    const html = `
      <div style="font-family:system-ui;min-width:180px;max-width:240px;">
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
          <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${statusColor};"></span>
          <strong style="font-size:14px;line-height:1.2;">${mic.openMic}</strong>
        </div>
        <p style="margin:2px 0;font-size:12px;color:#6b7280;">${mic.venueName}</p>
        ${distanceHtml}
        <div style="display:flex;gap:8px;margin-top:4px;font-size:12px;">
          <span>🕐 ${formatTime(mic.startTime)}</span>
          <span>💰 ${formatCost(mic.cost)}</span>
        </div>
        <div style="margin-top:4px;font-size:11px;color:#9ca3af;">
          🎤 ${formatStageTime(mic.stageTime)} min · ${statusLabel}
        </div>
        <div style="margin-top:6px;font-size:11px;color:#2563eb;cursor:pointer;">
          Click pin to view details →
        </div>
      </div>
    `;

    this.popup = new mapboxgl.Popup({
      offset: 14,
      closeButton: false,
      closeOnClick: false,
      maxWidth: '260px',
    })
      .setLngLat(coords)
      .setHTML(html)
      .addTo(this.map);
  }

  private removePopup() {
    this.map.getCanvas().style.cursor = '';
    if (this.popup) {
      this.popup.remove();
      this.popup = null;
    }
  }

  // ── User location marker ────────────────────────────────────────
  private userMarker: mapboxgl.Marker | null = null;

  public addUserLocationMarker(coords: [number, number]) {
    if (this.userMarker) this.userMarker.remove();

    const el = document.createElement('div');
    el.style.cssText = `
      width: 14px; height: 14px; border-radius: 50%;
      background: #3b82f6; border: 3px solid #fff;
      box-shadow: 0 0 0 3px rgba(59,130,246,0.3), 0 1px 4px rgba(0,0,0,0.3);
    `;

    this.userMarker = new mapboxgl.Marker({ element: el })
      .setLngLat(coords)
      .setPopup(new mapboxgl.Popup({ offset: 12 }).setHTML('<div style="font-size:12px;">You are here</div>'))
      .addTo(this.map);
  }

  // ── Cleanup ──────────────────────────────────────────────────────
  public destroy() {
    this.clearSpider();
    this.removePopup();
    if (this.userMarker) this.userMarker.remove();
  }
}
