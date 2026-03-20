import { App, TFile, TFolder, normalizePath } from 'obsidian';
import { QuickCalendarSettings } from '../types';
import { formatDate } from './date-utils';

/**
 * Daily notes integration.
 *
 * We implement this directly rather than depending on obsidian-daily-notes-interface
 * for long-term maintainability. The logic:
 * 1. Read user's daily note settings (folder, format, template)
 * 2. Format dates to match their filename pattern
 * 3. Check vault for existing notes
 * 4. Create new notes from template when clicked
 */

/** Try to read settings from the core Daily Notes plugin */
export function getDailyNoteSettings(app: App, pluginSettings: QuickCalendarSettings): {
  folder: string;
  format: string;
  template: string;
} {
  // First check if core daily notes plugin has settings
  const corePlugin = (app as any).internalPlugins?.getPluginById?.('daily-notes');
  const coreSettings = corePlugin?.instance?.options;

  // Also check for Periodic Notes plugin settings
  const periodicNotes = (app as any).plugins?.getPlugin?.('periodic-notes');
  const periodicSettings = periodicNotes?.settings?.daily;

  return {
    folder: pluginSettings.dailyNoteFolder
      || periodicSettings?.folder
      || coreSettings?.folder
      || '',
    format: pluginSettings.dailyNoteDateFormat
      || periodicSettings?.format
      || coreSettings?.format
      || 'YYYY-MM-DD',
    template: pluginSettings.dailyNoteTemplate
      || periodicSettings?.template
      || coreSettings?.template
      || '',
  };
}

/** Get set of existing daily note filenames (without extension) */
export function getExistingDailyNotes(app: App, folder: string): Set<string> {
  const notes = new Set<string>();
  const folderPath = folder ? normalizePath(folder) : '';
  const root = folderPath
    ? app.vault.getAbstractFileByPath(folderPath)
    : app.vault.getRoot();

  if (root instanceof TFolder) {
    for (const child of root.children) {
      if (child instanceof TFile && child.extension === 'md') {
        notes.add(child.basename);
      }
    }
  }

  return notes;
}

/** Open an existing daily note or create a new one */
export async function openOrCreateDailyNote(
  app: App,
  date: Date,
  settings: { folder: string; format: string; template: string },
): Promise<void> {
  const filename = formatDate(date, settings.format);
  const folder = settings.folder ? normalizePath(settings.folder) : '';
  const filePath = folder ? `${folder}/${filename}.md` : `${filename}.md`;
  const normalizedPath = normalizePath(filePath);

  // Check if file already exists
  let file = app.vault.getAbstractFileByPath(normalizedPath);

  if (file instanceof TFile) {
    // Open existing note
    await app.workspace.getLeaf(false).openFile(file);
    return;
  }

  // Create the folder if it doesn't exist
  if (folder) {
    const folderExists = app.vault.getAbstractFileByPath(folder);
    if (!folderExists) {
      await app.vault.createFolder(folder);
    }
  }

  // Read template content if specified
  let content = '';
  if (settings.template) {
    const templatePath = normalizePath(settings.template);
    const templateFile = app.vault.getAbstractFileByPath(templatePath);
    if (templateFile instanceof TFile) {
      content = await app.vault.read(templateFile);
      // Basic template variable substitution
      content = content
        .replace(/{{date}}/g, filename)
        .replace(/{{title}}/g, filename)
        .replace(/{{time}}/g, new Date().toLocaleTimeString());
    }
  }

  // Create the file and open it
  const newFile = await app.vault.create(normalizedPath, content);
  await app.workspace.getLeaf(false).openFile(newFile);
}
