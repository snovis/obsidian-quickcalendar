# Templater Daily Note Folder Trigger

## What This Is

A Templater **folder template** that auto-applies the Daily Note template when a
new file with a `YYYY-MM-DD` filename is created in the Daily Notes folder.

This means clicking any wikilink like `[[2026-03-20]]` — whether from QuickCalendar,
a navigation link, or anywhere in your vault — will create a fully formatted daily note.

## How It Works

The trigger script is a copy of `Daily Note - ACTIVE.md` (v20) with one addition:
a date-format guard at the top. When a new file is created in the Daily Notes folder:

1. Templater fires the folder template
2. The guard checks if the filename matches `YYYY-MM-DD` format
3. If yes → applies the full daily note template (identical output to the core template)
4. If no → bails out silently, leaving the file untouched

This guard is important because other non-date files might be created in the
Daily Notes folder, and you don't want the template applied to those.

## Setup

1. Copy `Daily Note Template.md` (in this folder) to your vault's Templates folder
2. In Templater settings → **Folder Templates**, map your Daily Notes folder to that template
3. Enable **"Trigger Templater on new file creation"** in Templater settings

## V20 Changes (2026-03-20)

Replaced legacy `{{date:...}}` syntax (Obsidian core Templates plugin) with
Templater `moment()` calls. The `{{date:...}}` tags were fossils from early
template versions — they only worked when the core Daily Notes plugin created
the file. The `moment()` equivalents work in all contexts: core daily note
creation, Templater folder triggers, and manual template insertion.

Specific replacements:
- `{{date:MMMM Do, YYYY}}` → `<% moment(tp.file.title, "YYYY-MM-DD").format("MMMM Do, YYYY") %>`
- `{{date:dddd}}` → `<% moment(tp.file.title, "YYYY-MM-DD").format("dddd") %>`

Also removed commented-out legacy moment code that was superseded by `tp.date.now()` calls.
