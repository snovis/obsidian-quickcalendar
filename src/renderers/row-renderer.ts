import { BaseRenderer } from './base-renderer';
import { MonthData, DayInfo } from '../types';

/**
 * Row view: 12 horizontal strips, one per month.
 * Each month is a single row of day cells flowing left to right.
 * Compact, scannable, bookmark-style layout.
 */
export class RowRenderer extends BaseRenderer {
  render(container: HTMLElement): void {
    const wrapper = container.createEl('div', { cls: 'qc-row-view' });
    const table = wrapper.createEl('table', { cls: 'qc-row-table' });

    // Header row with day numbers 1-31
    const thead = table.createEl('thead');
    const headerRow = thead.createEl('tr', { cls: 'qc-row-header' });
    headerRow.createEl('th', { cls: 'qc-row-month-label', text: '' });
    for (let d = 1; d <= 31; d++) {
      headerRow.createEl('th', { cls: 'qc-row-day-header', text: String(d) });
    }

    const tbody = table.createEl('tbody');

    for (const monthData of this.months) {
      this.renderMonthRow(tbody, monthData);
    }
  }

  private renderMonthRow(tbody: HTMLElement, monthData: MonthData): void {
    const row = tbody.createEl('tr', { cls: 'qc-row-month-row' });

    // Month label
    row.createEl('td', {
      cls: 'qc-row-month-name',
      text: monthData.shortName,
    });

    // Flatten all days from weeks into a map by day-of-month
    const dayMap = new Map<number, DayInfo>();
    for (const week of monthData.weeks) {
      for (const day of week) {
        if (day) {
          dayMap.set(day.day, day);
        }
      }
    }

    // Render cells for days 1-31
    const daysInMonth = new Date(monthData.year, monthData.month + 1, 0).getDate();
    for (let d = 1; d <= 31; d++) {
      if (d <= daysInMonth) {
        const dayInfo = dayMap.get(d);
        if (dayInfo) {
          this.createDayCell(row, dayInfo);
        } else {
          this.createEmptyCell(row);
        }
      } else {
        // Day doesn't exist in this month (e.g., Feb 30)
        row.createEl('td', { cls: 'qc-day-cell qc-nonexistent' });
      }
    }
  }
}
