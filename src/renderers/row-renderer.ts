import { BaseRenderer } from './base-renderer';
import { MonthData, DayInfo } from '../types';
import { weekDayToIndex } from '../utils/date-utils';
import { openOrCreateDailyNote } from '../utils/daily-notes';

/**
 * Row view: Compact horizontal yearly planner (à la classic Yearly Planner).
 * 12 rows (one per month), up to 37 day-of-week-aligned columns.
 * Header & footer show cycling 2-letter day abbreviations (Su Mo Tu …).
 * Cells contain the day-of-month number. Weekend columns are shaded.
 * Small font, 2-char-wide cells.
 */
export class RowRenderer extends BaseRenderer {
  /** Max columns: up to 6 offset days + 31 days = 37 */
  private readonly TOTAL_COLS = 37;

  render(container: HTMLElement): void {
    const wrapper = container.createEl('div', { cls: 'qc-row-view' });
    const table = wrapper.createEl('table', { cls: 'qc-row-table' });

    const startDayIndex = weekDayToIndex(this.config.startDay);
    const dayAbbrevs = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

    // --- Header row: cycling day-of-week abbreviations ---
    const thead = table.createEl('thead');
    this.buildDowHeaderRow(thead, startDayIndex, dayAbbrevs);

    // --- Month rows ---
    const tbody = table.createEl('tbody');
    for (const monthData of this.months) {
      this.renderMonthRow(tbody, monthData, startDayIndex);
    }

    // --- Footer row: repeat day-of-week abbreviations ---
    const tfoot = table.createEl('tfoot');
    this.buildDowHeaderRow(tfoot, startDayIndex, dayAbbrevs);
  }

  /** Build a header/footer row of cycling day abbreviations */
  private buildDowHeaderRow(
    parent: HTMLElement,
    startDayIndex: number,
    dayAbbrevs: string[],
  ): void {
    const row = parent.createEl('tr', { cls: 'qc-row-header' });
    row.createEl('th', { cls: 'qc-row-month-label', text: '' });

    for (let c = 0; c < this.TOTAL_COLS; c++) {
      const dowIndex = (startDayIndex + c) % 7;
      const isWe = dowIndex === 0 || dowIndex === 6;
      row.createEl('th', {
        cls: `qc-row-day-header${isWe ? ' qc-row-weekend-header' : ''}`,
        text: dayAbbrevs[dowIndex],
      });
    }
  }

  private renderMonthRow(
    tbody: HTMLElement,
    monthData: MonthData,
    startDayIndex: number,
  ): void {
    const row = tbody.createEl('tr', { cls: 'qc-row-month-row' });

    // Month label (sticky left)
    row.createEl('td', {
      cls: 'qc-row-month-name',
      text: monthData.shortName,
    });

    // Flatten days into a map by day number
    const dayMap = new Map<number, DayInfo>();
    for (const week of monthData.weeks) {
      for (const day of week) {
        if (day) {
          dayMap.set(day.day, day);
        }
      }
    }

    // Day-of-week offset for the 1st of this month
    const firstDow = new Date(monthData.year, monthData.month, 1).getDay();
    const offset = (firstDow - startDayIndex + 7) % 7;
    const daysInMonth = new Date(monthData.year, monthData.month + 1, 0).getDate();

    for (let c = 0; c < this.TOTAL_COLS; c++) {
      const dayNum = c - offset + 1;
      const dowIndex = (startDayIndex + c) % 7;
      const isWe = dowIndex === 0 || dowIndex === 6;

      if (dayNum >= 1 && dayNum <= daysInMonth) {
        // Build box-boundary classes
        const boxCls: string[] = ['qc-row-box'];
        if (dayNum === 1) boxCls.push('qc-row-box-left');
        if (dayNum === daysInMonth) boxCls.push('qc-row-box-right');

        const dayInfo = dayMap.get(dayNum);
        if (dayInfo) {
          this.createRowDayCell(row, dayInfo, boxCls);
        } else {
          const cell = this.createEmptyCell(row);
          cell.addClass(...boxCls);
        }
      } else {
        // Empty padding — still shade weekends
        row.createEl('td', {
          cls: `qc-day-cell qc-nonexistent${isWe ? ' qc-weekend' : ''}`,
        });
      }
    }
  }

  /** Compact day cell — shows the day number */
  private createRowDayCell(
    parent: HTMLElement,
    dayInfo: DayInfo,
    extraCls: string[] = [],
  ): HTMLElement {
    const cell = parent.createEl('td', {
      cls: this.getDayCellClasses(dayInfo) + ' ' + extraCls.join(' '),
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
}
