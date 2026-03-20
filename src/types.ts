/**
 * QuickCalendar type definitions.
 *
 * Extensibility note: New view types are added by:
 * 1. Adding the view name to CalendarView union type
 * 2. Creating a renderer in src/renderers/ that implements BaseRenderer
 * 3. Registering it in the renderer registry (src/renderers/index.ts)
 */

/** Supported calendar view types */
export type CalendarView = 'grid' | 'row' | 'stream' | 'list';

/** Days of the week for start-day configuration */
export type WeekDay = 'sunday' | 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday';

/** Configuration passed via the code block JSON */
export interface QuickCalendarConfig {
  /** Year to display. Defaults to current year. */
  year: number;
  /** View mode. Defaults to 'grid'. */
  view: CalendarView;
  /** First day of the week. Defaults to plugin settings. */
  startDay: WeekDay;
  /** Show ISO week numbers (grid and stream only). */
  weekNumbers: boolean;
}

/** Plugin-level settings stored in data.json */
export interface QuickCalendarSettings {
  /** Default first day of week */
  defaultStartDay: WeekDay;
  /** Default view mode */
  defaultView: CalendarView;
  /** Show week numbers by default */
  defaultWeekNumbers: boolean;
  /** Daily note date format (moment.js format string, e.g. "YYYY-MM-DD") */
  dailyNoteDateFormat: string;
  /** Daily note folder path */
  dailyNoteFolder: string;
  /** Daily note template path */
  dailyNoteTemplate: string;
  /** Weekly note template path */
  weeklyNoteTemplate: string;
}

export const DEFAULT_SETTINGS: QuickCalendarSettings = {
  defaultStartDay: 'monday',
  defaultView: 'grid',
  defaultWeekNumbers: false,
  dailyNoteDateFormat: 'YYYY-MM-DD',
  dailyNoteFolder: '',
  dailyNoteTemplate: '',
  weeklyNoteTemplate: '',
};

/** Metadata about a single day cell for rendering */
export interface DayInfo {
  /** Date object for this day */
  date: Date;
  /** Day of month (1-31) */
  day: number;
  /** Month (0-11) */
  month: number;
  /** Year */
  year: number;
  /** Is this day today? */
  isToday: boolean;
  /** Is this a weekend day? (Sat or Sun) */
  isWeekend: boolean;
  /** Does a daily note exist for this day? */
  hasNote: boolean;
  /** The formatted filename for this day's daily note */
  noteFilename: string;
}

/** Month data structure for renderers */
export interface MonthData {
  /** Month index (0-11) */
  month: number;
  /** Year */
  year: number;
  /** Display name of month */
  name: string;
  /** Short name of month */
  shortName: string;
  /** Weeks in this month, each week is an array of DayInfo | null (null for empty cells) */
  weeks: (DayInfo | null)[][];
}
