import { Plugin } from 'obsidian';
import {
  QuickCalendarSettings,
  QuickCalendarConfig,
  CalendarView,
  WeekDay,
  DEFAULT_SETTINGS,
} from './types';
import { buildYearData } from './utils/date-utils';
import { getDailyNoteSettings, getExistingDailyNotes } from './utils/daily-notes';
import { createRenderer, getAvailableViews } from './renderers';
import { QuickCalendarSettingTab } from './settings';

const VIEW_LABELS: Record<CalendarView, string> = {
  grid: 'Grid',
  row: 'Row',
  stream: 'Stream',
};

export default class QuickCalendarPlugin extends Plugin {
  settings: QuickCalendarSettings = DEFAULT_SETTINGS;

  async onload(): Promise<void> {
    await this.loadSettings();

    // Register the code block processor
    this.registerMarkdownCodeBlockProcessor(
      'quickcalendar',
      (source, el, ctx) => {
        this.processCodeBlock(source, el);
      },
    );

    // Register settings tab
    this.addSettingTab(new QuickCalendarSettingTab(this.app, this));

    console.log('QuickCalendar loaded');
  }

  onunload(): void {
    console.log('QuickCalendar unloaded');
  }

  async loadSettings(): Promise<void> {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }

  /**
   * Process a ```quickcalendar code block.
   * Parses JSON config, builds calendar data, renders toolbar + calendar view.
   */
  private processCodeBlock(source: string, el: HTMLElement): void {
    // Parse config from code block content
    let userConfig: Partial<QuickCalendarConfig> = {};
    const trimmed = source.trim();

    if (trimmed.length > 0) {
      try {
        userConfig = JSON.parse(trimmed);
      } catch (e) {
        el.createEl('div', {
          cls: 'qc-error',
          text: `QuickCalendar: Invalid JSON configuration. ${(e as Error).message}`,
        });
        return;
      }
    }

    // Merge with defaults — these are the "live" values that controls can change
    const config: QuickCalendarConfig = {
      year: userConfig.year ?? new Date().getFullYear(),
      view: this.validateView(userConfig.view) ?? this.settings.defaultView,
      startDay: this.validateWeekDay(userConfig.startDay) ?? this.settings.defaultStartDay,
      weekNumbers: userConfig.weekNumbers ?? this.settings.defaultWeekNumbers,
    };

    // Wrapper that holds everything
    const wrapper = el.createEl('div', { cls: 'quickcalendar' });

    // Render toolbar + calendar
    this.renderWithToolbar(wrapper, config);
  }

  /**
   * Render the toolbar (year nav + view toggle) and the calendar.
   * Called on initial render and again when controls are clicked.
   */
  private renderWithToolbar(wrapper: HTMLElement, config: QuickCalendarConfig): void {
    wrapper.empty();
    wrapper.className = `quickcalendar qc-view-${config.view}`;

    // --- Toolbar ---
    const toolbar = wrapper.createEl('div', { cls: 'qc-toolbar' });

    // Year navigation
    const yearNav = toolbar.createEl('div', { cls: 'qc-year-nav' });

    const prevBtn = yearNav.createEl('button', {
      cls: 'qc-nav-btn',
      text: '\u25C0',
      attr: { 'aria-label': 'Previous year' },
    });
    prevBtn.addEventListener('click', () => {
      config.year--;
      this.renderWithToolbar(wrapper, config);
    });

    yearNav.createEl('span', {
      cls: 'qc-year-title',
      text: String(config.year),
    });

    const nextBtn = yearNav.createEl('button', {
      cls: 'qc-nav-btn',
      text: '\u25B6',
      attr: { 'aria-label': 'Next year' },
    });
    nextBtn.addEventListener('click', () => {
      config.year++;
      this.renderWithToolbar(wrapper, config);
    });

    // View toggle buttons
    const viewToggle = toolbar.createEl('div', { cls: 'qc-view-toggle' });
    for (const view of getAvailableViews()) {
      const btn = viewToggle.createEl('button', {
        cls: `qc-view-btn${view === config.view ? ' qc-view-active' : ''}`,
        text: VIEW_LABELS[view],
      });
      btn.addEventListener('click', () => {
        if (view !== config.view) {
          config.view = view;
          this.renderWithToolbar(wrapper, config);
        }
      });
    }

    // --- Calendar content ---
    const calendarContainer = wrapper.createEl('div', { cls: 'qc-calendar-content' });

    // Get daily note settings
    const dailyNoteSettings = getDailyNoteSettings(this.app, this.settings);
    const existingNotes = getExistingDailyNotes(this.app, dailyNoteSettings.folder);

    // Build calendar data
    const months = buildYearData(
      config.year,
      config.startDay,
      dailyNoteSettings.format,
      existingNotes,
    );

    // Render
    try {
      const renderer = createRenderer(
        config.view,
        this.app,
        config,
        months,
        dailyNoteSettings,
      );
      renderer.render(calendarContainer);
    } catch (e) {
      calendarContainer.createEl('div', {
        cls: 'qc-error',
        text: `QuickCalendar: ${(e as Error).message}`,
      });
    }
  }

  private validateView(view: string | undefined): CalendarView | null {
    const valid: CalendarView[] = ['grid', 'row', 'stream'];
    if (view && valid.includes(view as CalendarView)) {
      return view as CalendarView;
    }
    return null;
  }

  private validateWeekDay(day: string | undefined): WeekDay | null {
    const valid: WeekDay[] = [
      'sunday', 'monday', 'tuesday', 'wednesday',
      'thursday', 'friday', 'saturday',
    ];
    if (day && valid.includes(day as WeekDay)) {
      return day as WeekDay;
    }
    return null;
  }
}
