import { useEffect, useState } from "react";

/**
 * A Date that re-renders on a fixed interval.
 *
 * "Happening now · until 7:00 PM" has to stop saying that at 7:00 PM. Without
 * a ticking clock a mic looks live until the visitor reloads, which is exactly
 * the walk-across-town mistake the v3 map is meant to prevent.
 *
 * Defaults to a minute, which is the smallest unit any of the labels show.
 */
export function useNow(intervalMs = 60_000): Date {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    // Line the first tick up with the start of the next minute, so the label
    // flips when the clock does rather than up to a minute later.
    let intervalId: number | undefined;
    const msToNextTick = intervalMs - (Date.now() % intervalMs);

    const timeoutId = window.setTimeout(() => {
      setNow(new Date());
      intervalId = window.setInterval(() => setNow(new Date()), intervalMs);
    }, msToNextTick);

    return () => {
      window.clearTimeout(timeoutId);
      if (intervalId !== undefined) window.clearInterval(intervalId);
    };
  }, [intervalMs]);

  return now;
}
