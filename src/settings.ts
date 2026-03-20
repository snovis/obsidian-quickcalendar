import { App, PluginSettingTab, Setting } from 'obsidian';
import { QuickCalendarSettings, WeekDay, CalendarView } from './types';
import type QuickCalendarPlugin from './main';

export class QuickCalendarSettingTab extends PluginSettingTab {
  plugin: QuickCalendarPlugin;

  constructor(app: App, plugin: QuickCalendarPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl('h2', { text: 'QuickCalendar Settings' });

    // Default view
    new Setting(containerEl)
      .setName('Default view')
      .setDesc('The default calendar view when no view is specified in the code block.')
      .addDropdown((dropdown) =>
        dropdown
          .addOption('grid', 'Grid (3×4)')
          .addOption('row', 'Row (yearly planner)')
          .addOption('stream', 'Stream (continuous)')
          .addOption('list', 'List (1×12)')
          .setValue(this.plugin.settings.defaultView)
          .onChange(async (value) => {
            this.plugin.settings.defaultView = value as CalendarView;
            await this.plugin.saveSettings();
          }),
      );

    // Start day of week
    new Setting(containerEl)
      .setName('Start of week')
      .setDesc('First day of the week.')
      .addDropdown((dropdown) =>
        dropdown
          .addOption('monday', 'Monday')
          .addOption('sunday', 'Sunday')
          .addOption('saturday', 'Saturday')
          .setValue(this.plugin.settings.defaultStartDay)
          .onChange(async (value) => {
            this.plugin.settings.defaultStartDay = value as WeekDay;
            await this.plugin.saveSettings();
          }),
      );

    // Week numbers
    new Setting(containerEl)
      .setName('Show week numbers')
      .setDesc('Show ISO week numbers by default (grid and stream views only).')
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.defaultWeekNumbers)
          .onChange(async (value) => {
            this.plugin.settings.defaultWeekNumbers = value;
            await this.plugin.saveSettings();
          }),
      );

    // Daily notes section
    containerEl.createEl('h3', { text: 'Daily Notes' });
    containerEl.createEl('p', {
      text: 'QuickCalendar will auto-detect settings from the core Daily Notes or Periodic Notes plugins. Override them here if needed.',
      cls: 'setting-item-description',
    });

    // Daily note date format
    new Setting(containerEl)
      .setName('Date format')
      .setDesc('Moment.js format for daily note filenames (e.g., YYYY-MM-DD). Leave blank to auto-detect.')
      .addText((text) =>
        text
          .setPlaceholder('YYYY-MM-DD')
          .setValue(this.plugin.settings.dailyNoteDateFormat)
          .onChange(async (value) => {
            this.plugin.settings.dailyNoteDateFormat = value;
            await this.plugin.saveSettings();
          }),
      );

    // Daily note folder
    new Setting(containerEl)
      .setName('Daily notes folder')
      .setDesc('Folder where daily notes are stored. Leave blank to auto-detect.')
      .addText((text) =>
        text
          .setPlaceholder('Daily Notes')
          .setValue(this.plugin.settings.dailyNoteFolder)
          .onChange(async (value) => {
            this.plugin.settings.dailyNoteFolder = value;
            await this.plugin.saveSettings();
          }),
      );

    // Daily note template
    new Setting(containerEl)
      .setName('Daily note template')
      .setDesc('Path to template file for new daily notes. Leave blank to auto-detect.')
      .addText((text) =>
        text
          .setPlaceholder('Templates/Daily Note.md')
          .setValue(this.plugin.settings.dailyNoteTemplate)
          .onChange(async (value) => {
            this.plugin.settings.dailyNoteTemplate = value;
            await this.plugin.saveSettings();
          }),
      );
  }
}
