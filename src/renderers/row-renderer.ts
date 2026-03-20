import { BaseRenderer } from './base-renderer';
import { MonthData, DayInfo } from '../types';
import { weekDayToIndex } from '../utils/date-utils';

/**
 * Row view: 12 horizontal strips, one per month.
 * Days are aligned to day-of-week columns (like a Yearly Planner).
 * The header shows cycling day abbreviations across all 37 columns.
 * Weekends are shaded. Compact, scannable layout.
 */
export class RowRenderer extends BaseRenderer {
  /** Max columns needed: up to 6 offset days + 31 days = 37 */
  private readonly TOTAL_COLS = 37;

  render(container: HTMLElement): void {
    const wrapper = container.createEl('div', { cls: 'qc-row-view' });
    const table = wrapper.createEl('table', { cls: 'qc-row-table' });

    const startDayIndex = weekDayToIndex(this.config.startDay);
    const dayAbbrevs = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

    // Build cycling day-of-week header
    const thead = table.createEl('thead');
    const headerRow = thead.createEl('tr', { cls: 'qc-row-header' });
    headerRow.createEl('th', { cls: 'qc-row-month-label', text: '' });

    for (let c = 0; c < this.TOTAL_COLS; c++) {
      const dowIndex = (startDayIndex + c) % 7;
      const isWe = dowIndex === 0 || dowIndex === 6;
      headerRow.createEl('th', {
        cls: `qc-row-day-header${isWe ? ' qc-row-weekend-header' : ''}`,
        text: dayAbbrevs[dowIndex],
      });
    }

    const tbody = table.createEl('tbody');

    for (const monthData of this.months) {
      this.renderMonthRow(tbody, monthData, startDayIndex);
    }
  }

  private renderMonthRow(tbody: HTMLElement, monthData: MonthData, startDayIndex: number): void {
    const row = tbody.createEl('tr', { cls: 'qc-row-month-row' });

    // Month label
    row.createEl('td', {
      cls: 'qc-row-month-name',
      text: monthData.shortName,
    });

    // What day-of-week does the 1st fall on?
    const firstDow = new Date(monthData.year, monthData.month, 1).getDay();
    // How many columns to offset from the left
    const offset = (firstDow - startDayIndex + 7) % 7;

    // Flatten days into a map
    const dayMap = new Map<number, DayInfo>();
    for (const week of monthData.weeks) {
      for (const day of week) {
        if (day) {
          dayMap.set(day.day, day);
        }
      }
    }

    const daysInMonth = new Date(monthData.year, monthData.month + 1, 0).getDate();

    for (let c = 0; c < this.TOTAL_COLS; c++) {
      const dayNum = c - offset + 1;
      if (dayNum >= 1 && dayNum <= daysInMonth) {
        const dayInfo = dayMap.get(dayNum);
        if (dayInfo) {
          this.createDayCell(row, dayInfo);
        } else {
          this.createEmptyCell(row);
        }
      } else {
        // Empty padding cell — but mark weekend columns
        const dowIndex = (startDayIndex + c) % 7;
        const isWe = dowIndex === 0 || dowIndex === 6;
        row.createEl('td', { cls: `qc-day-cell qc-nonexistent${isWe ? ' qc-weekend' : ''}` });
      }
    }
  }
}
