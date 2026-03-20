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
import { createRenderer } from './renderers';
import { QuickCalendarSettingTab } from './settings';

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
   * Parses JSON config, builds calendar data, and renders the appropriate view.
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

    // Merge with defaults
    const config: QuickCalendarConfig = {
      year: userConfig.year ?? new Date().getFullYear(),
      view: this.validateView(userConfig.view) ?? this.settings.defaultView,
      startDay: this.validateWeekDay(userConfig.startDay) ?? this.settings.defaultStartDay,
      weekNumbers: userConfig.weekNumbers ?? this.settings.defaultWeekNumbers,
    };

    // Get daily note settings (auto-detect from core/periodic notes plugins)
    const dailyNoteSettings = getDailyNoteSettings(this.app, this.settings);

    // Get existing daily notes for "has note" indicators
    const existingNotes = getExistingDailyNotes(this.app, dailyNoteSettings.folder);

    // Build calendar data
    const months = buildYearData(
      config.year,
      config.startDay,
      dailyNoteSettings.format,
      existingNotes,
    );

    // Create container with base class
    const container = el.createEl('div', {
      cls: `quickcalendar qc-view-${config.view}`,
    });

    // Render using the appropriate renderer
    try {
      const renderer = createRenderer(
        config.view,
        this.app,
        config,
        months,
        dailyNoteSettings,
      );
      renderer.render(container);
    } catch (e) {
      container.createEl('div', {
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
