import { App, AbstractInputSuggest, TFile, TFolder, TAbstractFile } from 'obsidian';

/**
 * File path suggest — shows matching vault files as you type.
 * Optionally filters by extension (e.g. 'md').
 */
export class FileSuggest extends AbstractInputSuggest<TFile> {
  private extension: string | null;
  private inputEl: HTMLInputElement;

  constructor(app: App, inputEl: HTMLInputElement, extension: string | null = 'md') {
    super(app, inputEl);
    this.inputEl = inputEl;
    this.extension = extension;
  }

  getSuggestions(query: string): TFile[] {
    const lowerQuery = query.toLowerCase();
    const files = this.app.vault.getFiles();
    return files
      .filter((file) => {
        if (this.extension && file.extension !== this.extension) return false;
        return file.path.toLowerCase().includes(lowerQuery);
      })
      .sort((a, b) => a.path.localeCompare(b.path))
      .slice(0, 50);
  }

  renderSuggestion(file: TFile, el: HTMLElement): void {
    el.setText(file.path);
  }

  selectSuggestion(file: TFile): void {
    this.setValue(file.path);
    // Dispatch input event so the Setting's onChange handler fires and saves
    this.inputEl.dispatchEvent(new Event('input', { bubbles: true }));
    this.close();
  }
}

/**
 * Folder path suggest — shows matching vault folders as you type.
 */
export class FolderSuggest extends AbstractInputSuggest<TFolder> {
  private inputEl: HTMLInputElement;

  constructor(app: App, inputEl: HTMLInputElement) {
    super(app, inputEl);
    this.inputEl = inputEl;
  }

  getSuggestions(query: string): TFolder[] {
    const lowerQuery = query.toLowerCase();
    const folders: TFolder[] = [];

    const collectFolders = (folder: TAbstractFile) => {
      if (folder instanceof TFolder) {
        folders.push(folder);
        for (const child of folder.children) {
          collectFolders(child);
        }
      }
    };

    const root = this.app.vault.getRoot();
    collectFolders(root);

    return folders
      .filter((f) => f.path.toLowerCase().includes(lowerQuery))
      .sort((a, b) => a.path.localeCompare(b.path))
      .slice(0, 50);
  }

  renderSuggestion(folder: TFolder, el: HTMLElement): void {
    el.setText(folder.path || '/');
  }

  selectSuggestion(folder: TFolder): void {
    this.setValue(folder.path);
    // Dispatch input event so the Setting's onChange handler fires and saves
    this.inputEl.dispatchEvent(new Event('input', { bubbles: true }));
    this.close();
  }
}
