import { useNavigate } from "react-router-dom";

import SEO from "@/components/SEO";
import MapSplitView from "@/components/map/MapSplitView";
import OpenMicsMapRefactored from "@/components/map/OpenMicsMapRefactored";
import { useIsDesktop } from "@/hooks/useIsDesktop";
import { useOpenMics } from "@/hooks/useOpenMics";
import { micIdOf } from "@/utils/venues";

/**
 * The Map tab inside the v3 shell.
 *
 * Both layouts are already built in step 1: `MapSplitView` is the desktop
 * split from WebMap.dc.html, `OpenMicsMapRefactored` on its own is the phone
 * full-bleed map from MapBubbles.dc.html. This screen just picks one and sends
 * a tapped mic through to the v3 detail page.
 */
export default function V3Map() {
  const isDesktop = useIsDesktop();
  const navigate = useNavigate();
  const { data: mics = [] } = useOpenMics();

  const openMic = (mic: Parameters<typeof micIdOf>[0]) => {
    const id = micIdOf(mic);
    if (id) navigate(`/v3/mic/${encodeURIComponent(id)}`);
  };

  return (
    <div className="absolute inset-0" style={{ top: isDesktop ? 68 : 0 }}>
      <SEO
        title="Map of NYC open mics | Comediq"
        description="Every open mic in New York on one map. What is happening now, and what is on next."
      />
      {isDesktop ? (
        <MapSplitView mics={mics} onMicSelect={openMic} />
      ) : (
        <OpenMicsMapRefactored variant="full" mics={mics} onMicSelect={openMic} />
      )}
    </div>
  );
}
