import { BaseRenderer } from './base-renderer';

/**
 * Grid view: 3 columns × 4 rows of mini-calendars.
 * Classic wall calendar / timeanddate.com layout.
 */
export class GridRenderer extends BaseRenderer {
  render(container: HTMLElement): void {
    const wrapper = container.createEl('div', { cls: 'qc-grid-view' });
    const grid = wrapper.createEl('div', { cls: 'qc-grid-container' });

    for (const monthData of this.months) {
      const monthEl = grid.createEl('div', { cls: 'qc-grid-month' });

      // Month header
      monthEl.createEl('div', {
        cls: 'qc-month-title',
        text: monthData.name,
      });

      // Calendar table
      const table = monthEl.createEl('table', { cls: 'qc-month-table' });
      const thead = table.createEl('thead');
      this.createDayHeaders(thead, true);

      const tbody = table.createEl('tbody');
      for (const week of monthData.weeks) {
        this.renderWeekRow(tbody, week, this.config.weekNumbers);
      }
    }
  }
}
