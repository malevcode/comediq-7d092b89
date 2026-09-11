import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
import { OpenMic } from "@/types/openMic";
import { DAYPART_LABELS, MicDaypart, groupMicsByDaypart } from "@/utils/micDaypart";
import { DiscoveryMicCard } from "./DiscoveryMicCard";

const DAYPART_ORDER: MicDaypart[] = ["daytime", "prime", "late"];

interface DiscoveryFeedProps {
  mics: OpenMic[];
  visibleCount: number;
  setVisibleCount: Dispatch<SetStateAction<number>>;
  selectedMicId?: string | null;
}

export function DiscoveryFeed({ mics, visibleCount, setVisibleCount, selectedMicId = null }: DiscoveryFeedProps) {
  const visibleMics = mics.slice(0, visibleCount);
  const grouped = groupMicsByDaypart(visibleMics);

  const [forceExpandedId, setForceExpandedId] = useState<string | null>(null);
  const [flashId, setFlashId] = useState<string | null>(null);
  const rowRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const registerRow = (id: string, el: HTMLDivElement | null) => {
    if (el) rowRefs.current.set(id, el);
    else rowRefs.current.delete(id);
  };

  useEffect(() => {
    if (!selectedMicId) return;

    setForceExpandedId(selectedMicId);
    const idx = mics.findIndex((m) => m.uniqueIdentifier === selectedMicId);
    if (idx >= 0 && idx >= visibleCount) {
      setVisibleCount(Math.max(visibleCount, idx + 10));
    }

    const timeout = setTimeout(() => {
      const el = rowRefs.current.get(selectedMicId);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        setFlashId(selectedMicId);
        setTimeout(() => setFlashId((cur) => (cur === selectedMicId ? null : cur)), 1500);
      }
    }, 80);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMicId]);

  return (
    <div className="flex flex-col gap-5">
      {DAYPART_ORDER.map((daypart) => {
        const daypartMics = grouped[daypart];
        if (daypartMics.length === 0) return null;

        return (
          <section key={daypart}>
            <h2 className="text-sm font-bold text-foreground mb-2 px-0.5">{DAYPART_LABELS[daypart]}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2.5">
              {daypartMics.map((mic) => (
                <DiscoveryMicCard
                  key={mic.id}
                  mic={mic}
                  forceExpanded={forceExpandedId === mic.uniqueIdentifier}
                  flash={flashId === mic.uniqueIdentifier}
                  onRegisterRow={registerRow}
                />
              ))}
            </div>
          </section>
        );
      })}

      {visibleCount < mics.length && (
        <div className="flex justify-center pb-2">
          <button
            className="px-4 py-2 bg-comediq-blue text-white rounded-full hover:bg-comediq-blue-dark text-sm font-medium"
            onClick={() => setVisibleCount((c) => c + 100)}
          >
            Show More
          </button>
        </div>
      )}
    </div>
  );
}
