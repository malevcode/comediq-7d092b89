import { useCallback, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { getOrCreateNextEvent, fetchEventLineup, signUpForEvent } from "@/api/signups";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import type { OpenMic } from "@/types/openMic";

/**
 * The Register → check in → set flow from Main.dc.html's sheets, against the
 * tables and functions that already exist.
 *
 *   - Register writes a `mic_signups` row through the existing
 *     `getOrCreateNextEvent` + `signUpForEvent` pair.
 *   - Check in calls `check_in_mic(p_mic_unique_identifier, p_latitude,
 *     p_longitude, p_accuracy_meters)`, which is live. It is the function that
 *     decides whether the comic is close enough, so the "in range" test is the
 *     database's, not ours.
 *   - The running order comes from `get_event_lineup`, via `fetchEventLineup`.
 *
 * The four states the States.dc.html board names map onto this as:
 *   before    - signed up, not yet in range
 *   inRange   - the browser has a fix close to the venue, so Check in shows
 *   checking  - check_in_mic in flight
 *   checkedIn - checked in, spot and set unlocked
 */

export type TrackState = "idle" | "before" | "inRange" | "checking" | "checkedIn";

/** The boards say "Get within 0.1 mi of the venue". */
const IN_RANGE_MILES = 0.1;
const EARTH_MILES = 3958.8;

function milesBetween(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_MILES * Math.asin(Math.sqrt(a));
}

export interface Registration {
  state: TrackState;
  /** The signup row's id, once registered. */
  signupId: string | null;
  eventId: string | null;
  /** Your place in the running order, once checked in. */
  position: number | null;
  listSize: number | null;
  /** How many ahead of you have already checked in. */
  checkedInAhead: number | null;
  error: string | null;
  isRegistering: boolean;
  register: () => void;
  checkIn: () => void;
  /** Ask the browser where we are, to decide whether Check in should show. */
  locate: () => void;
  distanceMiles: number | null;
}

export function useMicRegistration(mic: OpenMic | null): Registration {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [signupId, setSignupId] = useState<string | null>(null);
  const [eventId, setEventId] = useState<string | null>(null);
  const [checkedIn, setCheckedIn] = useState(false);
  const [checking, setChecking] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const distanceMiles = useMemo(() => {
    if (!coords || typeof mic?.latitude !== "number" || typeof mic?.longitude !== "number") {
      return null;
    }
    return milesBetween(coords.lat, coords.lng, mic.latitude, mic.longitude);
  }, [coords, mic?.latitude, mic?.longitude]);

  const { data: lineup } = useQuery({
    queryKey: ["eventLineup", eventId],
    queryFn: () => fetchEventLineup(eventId!),
    enabled: Boolean(eventId) && checkedIn,
    // The order shifts as other comics check in, so this refreshes while the
    // tracker is open. 20s matches the existing useEventLineup.
    refetchInterval: 20_000,
  });

  const registerMutation = useMutation({
    mutationFn: async () => {
      if (!mic) throw new Error("No mic selected");
      if (!user) throw new Error("Sign in to register for a mic.");

      const event = await getOrCreateNextEvent(mic.uniqueIdentifier, mic.day, mic.startTime);
      const eid = (event as { id?: string } | null)?.id;
      if (!eid) throw new Error("That mic has no sign-up sheet yet.");

      const signup = await signUpForEvent(eid);
      return { eventId: eid, signupId: (signup as { id?: string } | null)?.id ?? null };
    },
    onSuccess: ({ eventId: eid, signupId: sid }) => {
      setEventId(eid);
      setSignupId(sid);
      setError(null);
      queryClient.invalidateQueries({ queryKey: ["userSignups"] });
      queryClient.invalidateQueries({ queryKey: ["signupEvents", mic?.uniqueIdentifier] });
    },
    onError: (err: unknown) => {
      setError(err instanceof Error ? err.message : "Could not register for that mic.");
    },
  });

  const locate = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setError("This browser cannot share your location, so check-in is not available here.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({ lat: position.coords.latitude, lng: position.coords.longitude });
        setError(null);
      },
      () => setError("We could not get your location. Check in needs it to confirm you are here."),
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  }, []);

  const checkIn = useCallback(() => {
    if (!mic || !coords) {
      locate();
      return;
    }
    setChecking(true);
    void (async () => {
      const { error: rpcError } = await (supabase as any).rpc("check_in_mic", {
        p_mic_unique_identifier: mic.uniqueIdentifier,
        p_latitude: coords.lat,
        p_longitude: coords.lng,
        p_accuracy_meters: null,
      });
      setChecking(false);
      if (rpcError) {
        setError(rpcError.message || "Check-in did not go through.");
        return;
      }
      setCheckedIn(true);
      setError(null);
      if (eventId) queryClient.invalidateQueries({ queryKey: ["eventLineup", eventId] });
    })();
  }, [mic, coords, eventId, locate, queryClient]);

  // get_event_lineup already returns the running order, so the position is
  // the row's own lineup_position rather than an index we recompute.
  const mine = useMemo(
    () => (lineup && user ? lineup.find((row) => row.user_id === user.id) ?? null : null),
    [lineup, user],
  );
  const position = mine?.lineup_position ?? null;

  /**
   * The boards show "Now up: #3 · about 24 min to you". Nothing in the data
   * says who is on stage: `get_event_lineup` returns the order and each
   * comic's check-in time, but no "currently performing" marker, and no host
   * screen sets one. Guessing it from elapsed time would tell a comic they
   * have 20 minutes when they might have two - precisely the mistake this
   * flow exists to prevent - so the tracker shows what is real (your number,
   * the list length, how many ahead of you have arrived) and leaves the
   * countdown out.
   *
   * TODO: add a host "now up" control, then this can show the real thing.
   */
  const checkedInAhead = useMemo(() => {
    if (!lineup || position === null) return null;
    return lineup.filter(
      (row) => row.checked_in_at !== null && row.lineup_position < position,
    ).length;
  }, [lineup, position]);

  const state: TrackState = !signupId
    ? "idle"
    : checkedIn
      ? "checkedIn"
      : checking
        ? "checking"
        : distanceMiles !== null && distanceMiles <= IN_RANGE_MILES
          ? "inRange"
          : "before";

  return {
    state,
    signupId,
    eventId,
    position,
    listSize: lineup?.length ?? null,
    checkedInAhead,
    error,
    isRegistering: registerMutation.isPending,
    register: () => registerMutation.mutate(),
    checkIn,
    locate,
    distanceMiles,
  };
}
