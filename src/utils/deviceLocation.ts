import { Capacitor } from "@capacitor/core";
import { Geolocation } from "@capacitor/geolocation";

/** One GPS reading, in the only shape the rest of the app cares about. */
export type LocationReading = {
  latitude: number;
  longitude: number;
  /** How much error the device admits to, in metres. Null when it will not say. */
  accuracy: number | null;
};

const FRIENDLY_ERRORS: Record<number, string> = {
  1: "Location permission denied. Comediq needs it to prove you were at the mic.",
  2: "Could not get a location fix. Step outside and try again.",
  3: "Location request timed out. Try again.",
};

const OPTIONS = {
  enableHighAccuracy: true,
  timeout: 15000,
  // A fresh fix matters for a check-in, so accept nothing older than a minute.
  maximumAge: 60000,
};

/**
 * Reads one high-accuracy GPS fix.
 *
 * Inside the native iOS or Android shell this goes through Capacitor, which asks
 * for the OS permission properly. In a plain browser it falls back to the web
 * geolocation API. Both paths return the same shape and throw errors worth
 * showing a human.
 */
export async function readPreciseLocation(): Promise<LocationReading> {
  if (Capacitor.isNativePlatform()) {
    return readNativeLocation();
  }
  return readWebLocation();
}

async function readNativeLocation(): Promise<LocationReading> {
  const status = await Geolocation.checkPermissions();

  if (status.location !== "granted") {
    const requested = await Geolocation.requestPermissions({
      permissions: ["location"],
    });
    if (requested.location !== "granted") {
      throw new Error(FRIENDLY_ERRORS[1]);
    }
  }

  try {
    const position = await Geolocation.getCurrentPosition(OPTIONS);
    return {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy ?? null,
    };
  } catch (error: any) {
    throw new Error(FRIENDLY_ERRORS[2] + (error?.message ? ` (${error.message})` : ""));
  }
}

function readWebLocation(): Promise<LocationReading> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new Error("This device cannot share its location."));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) =>
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy ?? null,
        }),
      (error) => reject(new Error(FRIENDLY_ERRORS[error.code] ?? "Could not get your location.")),
      OPTIONS
    );
  });
}
