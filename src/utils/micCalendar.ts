import { OpenMic } from "@/types/openMic";

function getNextOccurrence(mic: OpenMic) {
  const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const today = new Date();
  const currentDay = today.getDay();
  const targetDay = daysOfWeek.indexOf(mic.day);
  let daysUntil = targetDay - currentDay;
  if (daysUntil < 0) {
    daysUntil += 7;
  }
  const nextDate = new Date(today);
  nextDate.setDate(today.getDate() + daysUntil);
  return nextDate;
}

export function generateCalendarEvent(mic: OpenMic) {
  const nextDate = getNextOccurrence(mic);
  const [startHour, startMinute] = mic.startTime.replace(/[^\d:]/g, '').split(':').map(Number);
  const [endHour, endMinute] = mic.latestEndTime
    ? mic.latestEndTime.replace(/[^\d:]/g, '').split(':').map(Number)
    : [startHour + 1, startMinute];

  let startHour24 = startHour;
  const normalizedStartTime = mic.startTime.toUpperCase();
  if (normalizedStartTime.includes('PM') && startHour !== 12) startHour24 += 12;
  if (normalizedStartTime.includes('AM') && startHour === 12) startHour24 = 0;

  let endHour24 = endHour;
  if (mic.latestEndTime) {
    const normalizedEndTime = mic.latestEndTime.toUpperCase();
    if (normalizedEndTime.includes('PM') && endHour !== 12) endHour24 += 12;
    if (normalizedEndTime.includes('AM') && endHour === 12) endHour24 = 0;
  }

  const startTotalMinutes = startHour24 * 60 + (startMinute || 0);
  const endTotalMinutes = endHour24 * 60 + (endMinute || 0);
  const durationMinutes = endTotalMinutes > startTotalMinutes
    ? endTotalMinutes - startTotalMinutes
    : 60;

  nextDate.setHours(startHour24, startMinute || 0, 0, 0);
  const endDate = new Date(nextDate.getTime() + durationMinutes * 60 * 1000);
  const formatDate = (date: Date) => date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  return {
    title: mic.openMic,
    start: formatDate(nextDate),
    end: formatDate(endDate),
    description: `Open mic at ${mic.venueName}\nCost: ${mic.cost}\nStage time: ${mic.stageTime}\n\nSign-up: ${mic.signUpInstructions}`,
    location: `${mic.venueName}, ${mic.location}`,
    date: nextDate,
  };
}

export function getGoogleCalendarUrl(mic: OpenMic) {
  const event = generateCalendarEvent(mic);
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${event.start}/${event.end}`,
    details: event.description,
    location: event.location,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Downloads an .ics file for the mic's next occurrence. Apple Calendar and
 * most other calendar apps open .ics files directly, so this one file
 * covers both the "Apple" and "Other" options in CalendarSheet.
 */
export function downloadMicIcs(mic: OpenMic) {
  const event = generateCalendarEvent(mic);
  const icalContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Comediq//Open Mic//EN',
    'BEGIN:VEVENT',
    `DTSTART:${event.start}`,
    `DTEND:${event.end}`,
    `SUMMARY:${event.title}`,
    `DESCRIPTION:${event.description.replace(/\n/g, '\\n')}`,
    `LOCATION:${event.location}`,
    `UID:${mic.uniqueIdentifier || mic.openMic.replace(/[^a-z0-9]/gi, '_').toLowerCase()}@comediq.app`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
  const blob = new Blob([icalContent], { type: 'text/calendar' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${mic.openMic.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ics`;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 0);
}
