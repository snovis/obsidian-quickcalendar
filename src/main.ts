import { Plugin, MarkdownPostProcessorContext, MarkdownView } from 'obsidian';
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
  list: 'List',
};

export default class QuickCalendarPlugin extends Plugin {
  settings: QuickCalendarSettings = DEFAULT_SETTINGS;

  async onload(): Promise<void> {
    await this.loadSettings();

    // Register the code block processor
    this.registerMarkdownCodeBlockProcessor(
      'quickcalendar',
      (source, el, ctx) => {
        this.processCodeBlock(source, el, ctx);
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
  private processCodeBlock(
    source: string,
    el: HTMLElement,
    ctx: MarkdownPostProcessorContext,
  ): void {
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

    // Render toolbar + calendar (pass el for getSectionInfo)
    this.renderWithToolbar(wrapper, config, ctx, el);
  }

  /**
   * Render the toolbar (year nav + view toggle + week num toggle) and the calendar.
   * Called on initial render and again when controls are clicked.
   */
  private renderWithToolbar(
    wrapper: HTMLElement,
    config: QuickCalendarConfig,
    ctx: MarkdownPostProcessorContext,
    codeBlockEl: HTMLElement,
  ): void {
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
      this.persistConfig(config, ctx, codeBlockEl);
      this.renderWithToolbar(wrapper, config, ctx, codeBlockEl);
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
      this.persistConfig(config, ctx, codeBlockEl);
      this.renderWithToolbar(wrapper, config, ctx, codeBlockEl);
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
          this.persistConfig(config, ctx, codeBlockEl);
          this.renderWithToolbar(wrapper, config, ctx, codeBlockEl);
        }
      });
    }

    // Week number toggle
    const weekNumBtn = toolbar.createEl('button', {
      cls: `qc-view-btn${config.weekNumbers ? ' qc-view-active' : ''}`,
      text: 'W#',
      attr: { 'aria-label': 'Toggle week numbers' },
    });
    weekNumBtn.addEventListener('click', () => {
      config.weekNumbers = !config.weekNumbers;
      this.persistConfig(config, ctx, codeBlockEl);
      this.renderWithToolbar(wrapper, config, ctx, codeBlockEl);
    });

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
        this.settings.weeklyNoteTemplate,
      );
      renderer.render(calendarContainer);
    } catch (e) {
      calendarContainer.createEl('div', {
        cls: 'qc-error',
        text: `QuickCalendar: ${(e as Error).message}`,
      });
    }
  }

  /**
   * Write the current config back into the code block JSON so changes persist.
   * Uses the MarkdownPostProcessorContext to locate the code block in the source,
   * then replaces the JSON content via the editor API.
   */
  private persistConfig(
    config: QuickCalendarConfig,
    ctx: MarkdownPostProcessorContext,
    codeBlockEl: HTMLElement,
  ): void {
    const sectionInfo = ctx.getSectionInfo(codeBlockEl);
    if (!sectionInfo) return;

    const { lineStart, lineEnd } = sectionInfo;
    const view = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (!view) return;

    const editor = view.editor;

    // Build pretty-printed JSON
    const json = JSON.stringify(config, null, 2);

    // Replace the content between the opening ``` and closing ``` lines
    // lineStart is the ``` quickcalendar line, lineEnd is the closing ```
    const from = { line: lineStart + 1, ch: 0 };
    const to = { line: lineEnd, ch: 0 };

    editor.replaceRange(json + '\n', from, to);
  }

  private validateView(view: string | undefined): CalendarView | null {
    const valid: CalendarView[] = ['grid', 'row', 'stream', 'list'];
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
