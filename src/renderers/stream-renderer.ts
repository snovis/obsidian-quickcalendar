import { BaseRenderer } from './base-renderer';
import { DayInfo } from '../types';
import { getISOWeekNumber, weekDayToIndex } from '../utils/date-utils';

/**
 * Stream view: A continuous 7-column weekly grid where months flow together.
 * Default: whitespace gaps between months.
 * Stream mode: months run together with no breaks.
 *
 * The "focus" month (or current month if none specified) gets emphasis.
 */
export class StreamRenderer extends BaseRenderer {
  render(container: HTMLElement): void {
    const wrapper = container.createEl('div', { cls: 'qc-stream-view' });
    const table = wrapper.createEl('table', { cls: 'qc-stream-table' });
    const thead = table.createEl('thead');
    this.createDayHeaders(thead, true);

    const tbody = table.createEl('tbody');

    // Build a continuous stream of weeks for the entire year
    const startDayIndex = weekDayToIndex(this.config.startDay);
    const year = this.config.year;

    // Find the first day that starts on our start-day-of-week
    // on or before Jan 1
    const jan1 = new Date(year, 0, 1);
    const jan1Day = jan1.getDay();
    const offsetBack = (jan1Day - startDayIndex + 7) % 7;
    const streamStart = new Date(year, 0, 1 - offsetBack);

    // Find the last day: Dec 31 extended to fill the week
    const dec31 = new Date(year, 11, 31);
    const dec31Day = dec31.getDay();
    const offsetForward = (6 - (dec31Day - startDayIndex + 7) % 7) % 7;
    const streamEnd = new Date(year, 11, 31 + offsetForward);

    let currentDate = new Date(streamStart);
    let currentMonth = -1;
    const currentRealMonth = new Date().getMonth();

    while (currentDate <= streamEnd) {
      // Scan the 7 days in this week to see if any day is the 1st of a new month
      for (let i = 0; i < 7; i++) {
        const peekDate = new Date(currentDate);
        peekDate.setDate(peekDate.getDate() + i);
        const peekMonth = peekDate.getMonth();
        const peekYear = peekDate.getFullYear();

        if (peekYear === year && peekMonth !== currentMonth) {
          // Insert month separator BEFORE this week row
          currentMonth = peekMonth;
          const separatorRow = tbody.createEl('tr', { cls: 'qc-stream-month-separator' });
          const colSpan = this.config.weekNumbers ? 8 : 7;
          separatorRow.createEl('td', {
            cls: 'qc-stream-month-label',
            text: this.months[peekMonth].name,
            attr: { colspan: String(colSpan) },
          });
          break; // Only one separator per week row
        }
      }

      const dateYear = currentDate.getFullYear();
      const dateMonth = currentDate.getMonth();
      const isInTargetYear = dateYear === year;

      // Build a week row
      const row = tbody.createEl('tr', {
        cls: `qc-week-row${isInTargetYear && dateMonth === currentRealMonth ? ' qc-focus-month' : ''}`,
      });

      // Week number
      if (this.config.weekNumbers) {
        const weekNum = getISOWeekNumber(currentDate);
        row.createEl('td', {
          cls: 'qc-week-num',
          text: String(weekNum),
        });
      }

      // 7 days
      for (let i = 0; i < 7; i++) {
        const d = new Date(currentDate);
        d.setDate(d.getDate() + i);

        if (d.getFullYear() !== year) {
          // Outside target year - render dimmed
          const cell = row.createEl('td', {
            cls: 'qc-day-cell qc-outside-year',
          });
          cell.createEl('span', {
            cls: 'qc-day-dim',
            text: String(d.getDate()),
          });
        } else {
          // Find matching DayInfo from our month data
          const monthIdx = d.getMonth();
          const dayOfMonth = d.getDate();
          const monthData = this.months[monthIdx];
          let dayInfo: DayInfo | null = null;

          for (const week of monthData.weeks) {
            for (const day of week) {
              if (day && day.day === dayOfMonth) {
                dayInfo = day;
                break;
              }
            }
            if (dayInfo) break;
          }

          if (dayInfo) {
            this.createDayCell(row, dayInfo);
          } else {
            this.createEmptyCell(row);
          }
        }
      }

      // Advance to next week
      currentDate.setDate(currentDate.getDate() + 7);
    }
  }
}
