import { DayInfo, MonthData, WeekDay } from '../types';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const MONTH_SHORT_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

const DAY_SHORT_NAMES = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

/** Convert WeekDay string to numeric day index (0=Sunday, 1=Monday, etc.) */
export function weekDayToIndex(day: WeekDay): number {
  const map: Record<WeekDay, number> = {
    sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
    thursday: 4, friday: 5, saturday: 6,
  };
  return map[day];
}

/** Get ordered day header labels based on start day */
export function getDayHeaders(startDay: WeekDay): string[] {
  const startIndex = weekDayToIndex(startDay);
  const headers: string[] = [];
  for (let i = 0; i < 7; i++) {
    headers.push(DAY_SHORT_NAMES[(startIndex + i) % 7]);
  }
  return headers;
}

/** Format a date using a simplified moment.js-compatible format string */
export function formatDate(date: Date, format: string): string {
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();

  return format
    .replace('YYYY', String(year))
    .replace('YY', String(year).slice(-2))
    .replace('MM', String(month + 1).padStart(2, '0'))
    .replace('M', String(month + 1))
    .replace('DD', String(day).padStart(2, '0'))
    .replace('D', String(day))
    .replace('MMMM', MONTH_NAMES[month])
    .replace('MMM', MONTH_SHORT_NAMES[month]);
}

/** Check if a date is today */
function isToday(date: Date): boolean {
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

/** Check if a date falls on a weekend (Saturday or Sunday) */
function isWeekend(date: Date): boolean {
  const dow = date.getDay();
  return dow === 0 || dow === 6;
}

/** Create a DayInfo object for a given date */
export function createDayInfo(
  date: Date,
  dateFormat: string,
  existingNotes: Set<string>,
): DayInfo {
  const filename = formatDate(date, dateFormat);
  return {
    date,
    day: date.getDate(),
    month: date.getMonth(),
    year: date.getFullYear(),
    isToday: isToday(date),
    isWeekend: isWeekend(date),
    hasNote: existingNotes.has(filename),
    noteFilename: filename,
  };
}

/** Get the number of days in a month */
function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

/**
 * Build MonthData for a given month/year.
 * Weeks are padded with nulls for alignment to the start day.
 */
export function buildMonthData(
  year: number,
  month: number,
  startDay: WeekDay,
  dateFormat: string,
  existingNotes: Set<string>,
): MonthData {
  const numDays = daysInMonth(year, month);
  const startDayIndex = weekDayToIndex(startDay);
  const weeks: (DayInfo | null)[][] = [];
  let currentWeek: (DayInfo | null)[] = [];

  // Determine offset for the first day of the month
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  let offset = (firstDayOfMonth - startDayIndex + 7) % 7;

  // Fill leading nulls
  for (let i = 0; i < offset; i++) {
    currentWeek.push(null);
  }

  // Fill days
  for (let d = 1; d <= numDays; d++) {
    const date = new Date(year, month, d);
    currentWeek.push(createDayInfo(date, dateFormat, existingNotes));

    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }

  // Fill trailing nulls
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push(null);
    }
    weeks.push(currentWeek);
  }

  return {
    month,
    year,
    name: MONTH_NAMES[month],
    shortName: MONTH_SHORT_NAMES[month],
    weeks,
  };
}

/** Build all 12 months of MonthData for a year */
export function buildYearData(
  year: number,
  startDay: WeekDay,
  dateFormat: string,
  existingNotes: Set<string>,
): MonthData[] {
  const months: MonthData[] = [];
  for (let m = 0; m < 12; m++) {
    months.push(buildMonthData(year, m, startDay, dateFormat, existingNotes));
  }
  return months;
}

/** Calculate ISO week number for a date */
export function getISOWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

/** Get the first non-null day in a week row (for week number calculation) */
export function getFirstDayInWeek(week: (DayInfo | null)[]): DayInfo | null {
  return week.find((d) => d !== null) ?? null;
}
