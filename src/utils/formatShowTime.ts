/**
 * Formats a 24h "HH:MM" or "HH:MM:SS" show time as 12h for display.
 *
 * show_time is nullable: some hosts give us a date and an Instagram handle
 * before they have locked a venue or a start time. Showing an invented time
 * is worse than admitting we do not have one, so null renders as "Time TBA".
 */
export function formatShowTime(time: string | null | undefined): string {
  if (!time) return 'Time TBA';

  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours, 10);
  if (Number.isNaN(hour)) return 'Time TBA';

  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
}
