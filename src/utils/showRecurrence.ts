export type ShowRepeat = 'none' | 'weekly' | 'biweekly' | 'monthly';

export const REPEAT_LABELS: Record<ShowRepeat, string> = {
  none: 'One time only',
  weekly: 'Every week',
  biweekly: 'Every 2 weeks',
  monthly: 'Every month (same weekday)',
};

/** How many dates are created up front. Nothing creates more automatically yet. */
const DATE_COUNT: Record<Exclude<ShowRepeat, 'none'>, number> = {
  weekly: 8,
  biweekly: 6,
  monthly: 6,
};

const WEEKDAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

/** Local "YYYY-MM-DD". Not toISOString, which can shift the day. */
export function toIsoDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

export function fromIsoDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function weekdayName(iso: string): string {
  return WEEKDAYS[fromIsoDate(iso).getDay()];
}

function nthWeekdayOfMonth(year: number, month: number, weekday: number, nth: number, last: boolean): Date {
  if (last) {
    const lastDay = new Date(year, month + 1, 0);
    lastDay.setDate(lastDay.getDate() - ((lastDay.getDay() - weekday + 7) % 7));
    return lastDay;
  }
  const first = new Date(year, month, 1);
  return new Date(year, month, 1 + ((weekday - first.getDay() + 7) % 7) + (nth - 1) * 7);
}

/**
 * The dates a repeating show runs on, starting with the date the host picked.
 * Monthly means the same weekday in the same position: a show on the 1st Sunday
 * repeats on every 1st Sunday, and a show on the last Friday on every last Friday.
 */
export function generateShowDates(startIso: string, repeat: ShowRepeat): string[] {
  if (repeat === 'none') return [startIso];
  const start = fromIsoDate(startIso);
  const count = DATE_COUNT[repeat];

  if (repeat === 'weekly' || repeat === 'biweekly') {
    const step = repeat === 'weekly' ? 7 : 14;
    return Array.from({ length: count }, (_, i) => {
      const date = new Date(start);
      date.setDate(start.getDate() + i * step);
      return toIsoDate(date);
    });
  }

  const weekday = start.getDay();
  const nth = Math.ceil(start.getDate() / 7);
  const daysInMonth = new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate();
  const isLast = start.getDate() + 7 > daysInMonth;
  return Array.from({ length: count }, (_, i) => {
    const target = new Date(start.getFullYear(), start.getMonth() + i, 1);
    return toIsoDate(nthWeekdayOfMonth(target.getFullYear(), target.getMonth(), weekday, nth, isLast));
  });
}
