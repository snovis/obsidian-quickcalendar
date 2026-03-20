import { BaseRenderer } from './base-renderer';

/**
 * List view: 1×12 single-column layout.
 * Each month gets a large, spacious cell — room for detail.
 * Ideal for embedding in a page where you want to scroll through
 * the year month by month.
 */
export class ListRenderer extends BaseRenderer {
  render(container: HTMLElement): void {
    const wrapper = container.createEl('div', { cls: 'qc-list-view' });
    const list = wrapper.createEl('div', { cls: 'qc-list-container' });

    for (const monthData of this.months) {
      const monthEl = list.createEl('div', { cls: 'qc-list-month' });

      // Month header
      monthEl.createEl('div', {
        cls: 'qc-list-month-title',
        text: monthData.name,
      });

      // Calendar table
      const table = monthEl.createEl('table', { cls: 'qc-list-month-table' });
      const thead = table.createEl('thead');
      this.createDayHeaders(thead, true);

      const tbody = table.createEl('tbody');
      for (const week of monthData.weeks) {
        this.renderWeekRow(tbody, week, this.config.weekNumbers);
      }
    }
  }
}
