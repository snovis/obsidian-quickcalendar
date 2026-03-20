import { App } from 'obsidian';
import { QuickCalendarConfig, MonthData, DayInfo } from '../types';
import { getDayHeaders, getISOWeekNumber, getFirstDayInWeek } from '../utils/date-utils';
import { openOrCreateDailyNote } from '../utils/daily-notes';

/**
 * Base class for all calendar view renderers.
 *
 * To create a new view:
 * 1. Extend this class
 * 2. Implement render()
 * 3. Register in src/renderers/index.ts
 *
 * Helper methods are provided for common cell rendering patterns.
 */
export abstract class BaseRenderer {
  protected app: App;
  protected config: QuickCalendarConfig;
  protected months: MonthData[];
  protected dailyNoteSettings: { folder: string; format: string; template: string };

  constructor(
    app: App,
    config: QuickCalendarConfig,
    months: MonthData[],
    dailyNoteSettings: { folder: string; format: string; template: string },
  ) {
    this.app = app;
    this.config = config;
    this.months = months;
    this.dailyNoteSettings = dailyNoteSettings;
  }

  /** Render the calendar into the given container element */
  abstract render(container: HTMLElement): void;

  /** Create a clickable day cell element */
  protected createDayCell(parent: HTMLElement, dayInfo: DayInfo): HTMLElement {
    const cell = parent.createEl('td', {
      cls: this.getDayCellClasses(dayInfo),
    });

    const link = cell.createEl('a', {
      cls: 'qc-day-link',
      text: String(dayInfo.day),
      attr: { 'data-date': dayInfo.noteFilename },
    });

    link.addEventListener('click', (e) => {
      e.preventDefault();
      openOrCreateDailyNote(this.app, dayInfo.date, this.dailyNoteSettings);
    });

    return cell;
  }

  /** Create an empty day cell (padding) */
  protected createEmptyCell(parent: HTMLElement): HTMLElement {
    return parent.createEl('td', { cls: 'qc-day-cell qc-empty' });
  }

  /** Get CSS classes for a day cell */
  protected getDayCellClasses(dayInfo: DayInfo): string {
    const classes = ['qc-day-cell'];
    if (dayInfo.isToday) classes.push('qc-today');
    if (dayInfo.isWeekend) classes.push('qc-weekend');
    if (dayInfo.hasNote) classes.push('qc-has-note');
    return classes.join(' ');
  }

  /** Create day-of-week header row */
  protected createDayHeaders(parent: HTMLElement, includeWeekNum: boolean = false): void {
    const headers = getDayHeaders(this.config.startDay);
    const headerRow = parent.createEl('tr', { cls: 'qc-header-row' });

    if (includeWeekNum && this.config.weekNumbers) {
      headerRow.createEl('th', { cls: 'qc-week-num-header', text: 'W' });
    }

    for (const h of headers) {
      headerRow.createEl('th', { cls: 'qc-day-header', text: h });
    }
  }

  /** Create a week number cell */
  protected createWeekNumberCell(parent: HTMLElement, week: (DayInfo | null)[]): void {
    if (!this.config.weekNumbers) return;

    const firstDay = getFirstDayInWeek(week);
    if (firstDay) {
      const weekNum = getISOWeekNumber(firstDay.date);
      parent.createEl('td', {
        cls: 'qc-week-num',
        text: String(weekNum),
      });
    } else {
      parent.createEl('td', { cls: 'qc-week-num' });
    }
  }

  /** Render a single week row (shared by grid and stream views) */
  protected renderWeekRow(tbody: HTMLElement, week: (DayInfo | null)[], showWeekNum: boolean): void {
    const row = tbody.createEl('tr', { cls: 'qc-week-row' });

    if (showWeekNum) {
      this.createWeekNumberCell(row, week);
    }

    for (const day of week) {
      if (day) {
        this.createDayCell(row, day);
      } else {
        this.createEmptyCell(row);
      }
    }
  }
}
