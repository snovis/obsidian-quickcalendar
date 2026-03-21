import { BaseRenderer } from './base-renderer';
import { MonthData, DayInfo } from '../types';
import { openOrCreateDailyNote } from '../utils/daily-notes';

/**
 * Row view: Compact horizontal yearly planner.
 * 12 rows (one per month), 31 columns (one per day-of-month).
 * Header shows day numbers 1–31. Month names are sticky on the left.
 * Very small font (8pt), thin Helvetica/Arial, 18px tall cells.
 * Day-of-week is shown as a single letter inside each cell.
 */
export class RowRenderer extends BaseRenderer {
  private readonly MAX_DAYS = 31;
  private readonly DOW_LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  render(container: HTMLElement): void {
    const wrapper = container.createEl('div', { cls: 'qc-row-view' });
    const table = wrapper.createEl('table', { cls: 'qc-row-table' });

    // Header row: month label + day numbers 1–31
    const thead = table.createEl('thead');
    const headerRow = thead.createEl('tr', { cls: 'qc-row-header' });
    headerRow.createEl('th', { cls: 'qc-row-month-label', text: '' });

    for (let d = 1; d <= this.MAX_DAYS; d++) {
      headerRow.createEl('th', {
        cls: 'qc-row-day-header',
        text: String(d),
      });
    }

    const tbody = table.createEl('tbody');

    for (const monthData of this.months) {
      this.renderMonthRow(tbody, monthData);
    }
  }

  private renderMonthRow(tbody: HTMLElement, monthData: MonthData): void {
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

    const daysInMonth = new Date(monthData.year, monthData.month + 1, 0).getDate();

    for (let d = 1; d <= this.MAX_DAYS; d++) {
      if (d <= daysInMonth) {
        const dayInfo = dayMap.get(d);
        if (dayInfo) {
          this.createRowDayCell(row, dayInfo);
        } else {
          this.createEmptyCell(row);
        }
      } else {
        // Day doesn't exist in this month
        row.createEl('td', { cls: 'qc-day-cell qc-nonexistent' });
      }
    }
  }

  /**
   * Create a compact day cell for row view.
   * Shows the day-of-week letter (S/M/T/W/T/F/S) instead of the day number.
   */
  private createRowDayCell(parent: HTMLElement, dayInfo: DayInfo): HTMLElement {
    const cell = parent.createEl('td', {
      cls: this.getDayCellClasses(dayInfo),
    });

    const dowLetter = this.DOW_LETTERS[dayInfo.date.getDay()];

    const link = cell.createEl('a', {
      cls: 'qc-day-link',
      text: dowLetter,
      attr: { 'data-date': dayInfo.noteFilename },
    });

    link.addEventListener('click', (e) => {
      e.preventDefault();
      openOrCreateDailyNote(this.app, dayInfo.date, this.dailyNoteSettings);
    });

    return cell;
  }
}
