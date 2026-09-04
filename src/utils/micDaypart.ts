import { OpenMic } from "@/types/openMic";

export type MicDaypart = "daytime" | "prime" | "late";

export const DAYPART_LABELS: Record<MicDaypart, string> = {
  daytime: "Daytime Mics",
  prime: "Prime Time Mics",
  late: "Late Night Mics",
};

// Daytime: before 5pm · Prime time: 6-8:30pm · Late night: after 8:30pm.
// Mics starting 5:00-5:59pm fall in the gap between daytime and prime; grouped with prime.
const PRIME_START_MINUTES = 17 * 60; // 5:00pm
const LATE_START_MINUTES = 20 * 60 + 30; // 8:30pm

export function parseMicStartMinutes(mic: Pick<OpenMic, "startTime">): number | null {
  const rawTime = mic.startTime;
  if (!rawTime) return null;

  const match = rawTime.trim().toLowerCase().match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/);
  if (!match) return null;

  const rawHour = Number(match[1]);
  const minutes = Number(match[2] ?? 0);
  const period = match[3];

  if (!Number.isFinite(rawHour) || !Number.isFinite(minutes)) return null;

  let hour = rawHour;
  if (period === "pm" && hour < 12) {
    hour += 12;
  } else if (period === "am" && hour === 12) {
    hour = 0;
  }

  return hour * 60 + minutes;
}

export function getMicDaypart(mic: Pick<OpenMic, "startTime">): MicDaypart {
  const startMinutes = parseMicStartMinutes(mic);
  if (startMinutes === null) return "prime";
  if (startMinutes >= LATE_START_MINUTES) return "late";
  if (startMinutes >= PRIME_START_MINUTES) return "prime";
  return "daytime";
}

export function groupMicsByDaypart<T extends Pick<OpenMic, "startTime">>(
  mics: T[],
): Record<MicDaypart, T[]> {
  const groups: Record<MicDaypart, T[]> = { daytime: [], prime: [], late: [] };
  mics.forEach((mic) => {
    groups[getMicDaypart(mic)].push(mic);
  });
  return groups;
}
