---
description: |
  Templater folder template script for auto-creating daily notes from wikilinks.

  SETUP INSTRUCTIONS:
  1. Copy the code block below into a template file in your vault (e.g., Templates/Daily Note.md)
  2. In Templater settings, go to "Folder Templates"
  3. Add a mapping: your Daily Notes folder → this template
  4. Enable "Trigger Templater on new file creation"

  HOW IT WORKS:
  When you click a wikilink like [[2026-03-20]], Obsidian creates a blank note.
  Templater's folder template fires and this script:
  1. Checks if the filename matches a date pattern (YYYY-MM-DD by default)
  2. If it matches, applies the daily note template content
  3. If it doesn't match, leaves the file alone (for non-date notes in the same folder)

  CUSTOMIZE:
  - Change the DATE_REGEX to match your date format
  - Edit the template content below the script block to your liking
---

# Templater Daily Note Folder Template

Save this as your daily note template (e.g., `Templates/Daily Note.md`):

```
<%*
// === QuickCalendar Daily Note Trigger ===
// This Templater script runs when a new file is created in your Daily Notes folder.
// It checks if the filename looks like a date and applies the template if so.

// Adjust this regex to match your daily note date format:
// YYYY-MM-DD → /^\d{4}-\d{2}-\d{2}$/
// DD-MM-YYYY → /^\d{2}-\d{2}-\d{4}$/
// YYYY.MM.DD → /^\d{4}\.\d{2}\.\d{2}$/
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const filename = tp.file.title;

if (!DATE_REGEX.test(filename)) {
  // Not a date-formatted file — skip template application
  // This prevents the template from being applied to non-daily-note files
  // that happen to be created in the same folder
  return;
}

// Parse the date from the filename for use in the template
const parts = filename.split('-');
const fileDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
const dayOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][fileDate.getDay()];
const monthName = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][fileDate.getMonth()];

// Calculate navigation dates
const prevDate = new Date(fileDate);
prevDate.setDate(prevDate.getDate() - 1);
const nextDate = new Date(fileDate);
nextDate.setDate(nextDate.getDate() + 1);
const prevStr = prevDate.toISOString().slice(0, 10);
const nextStr = nextDate.toISOString().slice(0, 10);
-%>
---
date: <% filename %>
day: <% dayOfWeek %>
---

# <% dayOfWeek %>, <% monthName %> <% fileDate.getDate() %>, <% fileDate.getFullYear() %>

← [[<% prevStr %>]] | [[<% nextStr %>]] →

## Tasks
- [ ]

## Notes


## Journal

<%*
// You can add more dynamic content here.
// For example, to auto-link to a weekly note:
// const weekNum = tp.date.now("ww", 0, filename, "YYYY-MM-DD");
// tR += `\nWeekly: [[${fileDate.getFullYear()}-W${weekNum}]]\n`;
-%>
```

## Alternative: Minimal Version

If you want a simpler template without the date guard (use this if your Daily Notes folder ONLY contains daily notes):

```
---
date: <% tp.file.title %>
---

# <% tp.file.title %>

← [[<% tp.date.now("YYYY-MM-DD", -1, tp.file.title, "YYYY-MM-DD") %>]] | [[<% tp.date.now("YYYY-MM-DD", 1, tp.file.title, "YYYY-MM-DD") %>]] →

## Tasks
- [ ]

## Notes

```
