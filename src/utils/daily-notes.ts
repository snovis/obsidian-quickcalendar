import { App, TFile, TFolder, normalizePath } from 'obsidian';
import { QuickCalendarSettings } from '../types';
import { formatDate, getISOWeekNumber } from './date-utils';

/**
 * Daily and weekly notes integration.
 *
 * We implement this directly rather than depending on obsidian-daily-notes-interface
 * for long-term maintainability. The logic:
 * 1. Read user's daily/weekly note settings (folder, format, template)
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

/**
 * Format an ISO week number into YYYY-Www format.
 * E.g., year 2026, week 10 → "2026-W10"
 */
export function formatWeekFilename(year: number, weekNum: number): string {
  return `${year}-W${String(weekNum).padStart(2, '0')}`;
}

/**
 * Try to use Templater's API to process a template into a file.
 * Uses write_template_to_file (same API used by Periodic Notes plugin).
 * Returns true if Templater handled it, false otherwise.
 */
async function applyTemplateViaTemplater(
  app: App,
  file: TFile,
  templateFile: TFile,
): Promise<boolean> {
  try {
    const templaterPlugin = (app as any).plugins?.getPlugin?.('templater-obsidian');
    if (!templaterPlugin || templaterPlugin._disabled) return false;

    const templater = templaterPlugin.templater;
    if (!templater || typeof templater.write_template_to_file !== 'function') return false;

    await templater.write_template_to_file(templateFile, file);
    return true;
  } catch (e) {
    console.warn('QuickCalendar: Templater integration failed, falling back to basic substitution', e);
    return false;
  }
}

/**
 * Apply basic {{variable}} substitution as a fallback when Templater isn't available.
 */
function applyBasicSubstitution(content: string, filename: string): string {
  return content
    .replace(/{{title}}/g, filename)
    .replace(/{{date}}/g, filename)
    .replace(/{{time}}/g, new Date().toLocaleTimeString());
}

/**
 * Open an existing weekly note or create a new one.
 * Weekly notes use the YYYY-Www format (e.g., 2026-W10).
 * They live in the same folder as daily notes by default.
 *
 * Template processing:
 * 1. If Templater plugin is available, use its API (supports full <%...%> syntax)
 * 2. Otherwise, fall back to basic {{title}}/{{date}}/{{time}} substitution
 */
export async function openOrCreateWeeklyNote(
  app: App,
  year: number,
  weekNum: number,
  folder: string,
  templatePath: string,
): Promise<void> {
  const filename = formatWeekFilename(year, weekNum);
  const folderPath = folder ? normalizePath(folder) : '';
  const filePath = folderPath ? `${folderPath}/${filename}.md` : `${filename}.md`;
  const normalizedPath = normalizePath(filePath);

  // Check if file already exists
  const file = app.vault.getAbstractFileByPath(normalizedPath);

  if (file instanceof TFile) {
    await app.workspace.getLeaf(false).openFile(file);
    return;
  }

  // Create the folder if it doesn't exist
  if (folderPath) {
    const folderExists = app.vault.getAbstractFileByPath(folderPath);
    if (!folderExists) {
      await app.vault.createFolder(folderPath);
    }
  }

  // Resolve template file (if any)
  let templateFile: TFile | null = null;
  if (templatePath) {
    const tplPath = normalizePath(templatePath);
    const tplAbstract = app.vault.getAbstractFileByPath(tplPath);
    if (tplAbstract instanceof TFile) {
      templateFile = tplAbstract;
    }
  }

  // Create the file (empty initially — template applied after)
  const newFile = await app.vault.create(normalizedPath, '');
  await app.workspace.getLeaf(false).openFile(newFile);

  // Apply template
  if (templateFile) {
    const templaterHandled = await applyTemplateViaTemplater(app, newFile, templateFile);

    if (!templaterHandled) {
      // Fallback: read template and do basic substitution
      const content = await app.vault.read(templateFile);
      await app.vault.modify(newFile, applyBasicSubstitution(content, filename));
    }
  }
}
