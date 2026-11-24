import { useEffect, useMemo, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

import { getMapboxToken } from "@/components/map/MapInitializer";
import { COMEDIQ_Q_INSET, COMEDIQ_Q_LOGO } from "@/lib/brand";
import { v3colors } from "@/theme/v3";
import type { VenueHistoryRow } from "@/api/venueHistory";
import { initialsOf } from "@/utils/venues";
import { ACTIVITY_STYLE, venueActivity } from "@/utils/venueHistory";

/**
 * The map behind Historical mics.
 *
 * Same marker style as /open-mics: a round bubble per venue with two-letter
 * initials, the real Q mark for Comediq-run rooms, built on the same
 * `.cq-bubble` CSS so the two maps cannot drift apart visually.
 *
 * The one difference this page needs: a venue with no mic running now is drawn
 * at half opacity, because most of this page is history.
 *
 * Venues with no coordinates are not plotted; the list is where they live. The
 * caller says how many that is.
 */

const NYC_CENTER: [number, number] = [-73.935242, 40.73061];
const BUBBLE_SIZE_RUNNING = 42;
const BUBBLE_SIZE_PAST = 34;

interface Props {
  venues: VenueHistoryRow[];
  onSelect: (slug: string) => void;
}

export default function HistoricalVenueMap({ venues, onSelect }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const onSelectRef = useRef(onSelect);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  const plottable = useMemo(
    () =>
      venues.filter(
        (venue) => typeof venue.latitude === "number" && typeof venue.longitude === "number",
      ),
    [venues],
  );

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      const token = await getMapboxToken();
      if (cancelled) return;
      if (!token) {
        setError("A Mapbox token is needed to show the map. The list has every venue.");
        return;
      }
      if (!containerRef.current || mapRef.current) return;

      mapboxgl.accessToken = token;
      const map = new mapboxgl.Map({
        container: containerRef.current,
        style: "mapbox://styles/mapbox/streets-v12",
        center: NYC_CENTER,
        zoom: 11,
        minZoom: 8,
        maxZoom: 18,
      });
      map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "bottom-right");
      map.on("load", () => !cancelled && setReady(true));
      mapRef.current = map;
    };

    void init();
    return () => {
      cancelled = true;
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map) return;

    markersRef.current.forEach((marker) => marker.remove());

    // Past rooms first, so a room running now is painted on top of them.
    const ordered = [...plottable].sort(
      (a, b) => Number(a.currently_running) - Number(b.currently_running),
    );

    markersRef.current = ordered.map((venue) => {
      const size = venue.currently_running ? BUBBLE_SIZE_RUNNING : BUBBLE_SIZE_PAST;
      const wrap = document.createElement("div");

      const button = document.createElement("button");
      button.type = "button";
      button.className = "cq-bubble-btn";
      button.style.width = `${size}px`;
      button.style.height = `${size}px`;
      button.setAttribute(
        "aria-label",
        `${venue.name}, ${venue.total_open_mics} ${
          venue.total_open_mics === 1 ? "mic" : "mics"
        }, ${ACTIVITY_STYLE[venueActivity(venue)].label}`,
      );

      const activity = venueActivity(venue);
      const style = ACTIVITY_STYLE[activity];

      const bubble = document.createElement("span");
      bubble.className = "cq-bubble";
      bubble.style.width = `${size}px`;
      bubble.style.height = `${size}px`;
      bubble.style.left = "0px";
      // Colour carries the status now, so nothing is faded. A white bubble at
      // half opacity would simply disappear against the map.
      bubble.style.opacity = "1";

      if (venue.has_comediq_run) {
        // A room Comediq runs itself keeps the Q mark, on the white disc the
        // logo is drawn for, with its status as a ring around the outside.
        bubble.style.backgroundColor = v3colors.white;
        bubble.style.backgroundImage = `url(${COMEDIQ_Q_LOGO})`;
        bubble.style.backgroundSize = COMEDIQ_Q_INSET;
        bubble.style.backgroundRepeat = "no-repeat";
        bubble.style.backgroundPosition = "center";
        bubble.style.boxShadow = `0 0 0 3px ${style.bg}, 0 4px 12px rgba(8,20,43,.28)`;
      } else {
        bubble.style.background = style.bg;
        bubble.style.color = style.fg;
        bubble.style.fontSize = `${Math.round(size * 0.34)}px`;
        bubble.textContent = initialsOf(venue.name);
        // A white bubble needs its own edge or it vanishes on pale map tiles.
        if (activity === "inactive") {
          bubble.style.border = `2px solid ${v3colors.border}`;
          bubble.style.boxShadow = "0 2px 8px rgba(8,20,43,.22)";
        }
      }

      button.appendChild(bubble);
      button.addEventListener("click", (event) => {
        event.stopPropagation();
        onSelectRef.current(venue.slug);
      });
      wrap.appendChild(button);

      return new mapboxgl.Marker({ element: wrap, anchor: "center" })
        .setLngLat([venue.longitude as number, venue.latitude as number])
        .addTo(map);
    });
  }, [ready, plottable]);

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full" />
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/85 px-6 text-center text-sm">
          {error}
        </div>
      )}
      {/* The same bubble CSS the /open-mics map uses. */}
      <style>{`
        .cq-bubble-btn{position:relative;display:block;background:none;border:0;padding:0;cursor:pointer}
        .cq-bubble{position:absolute;top:0;border-radius:9999px;border:2.5px solid #fff;box-shadow:0 4px 12px rgba(8,20,43,.28);background-size:cover;background-position:center;display:flex;align-items:center;justify-content:center;font-weight:800;letter-spacing:-.02em;overflow:hidden;box-sizing:border-box}
        .cq-bubble-btn:focus-visible{outline:3px solid #8FC2F5;outline-offset:3px;border-radius:9999px}
      `}</style>
    </div>
  );
}
