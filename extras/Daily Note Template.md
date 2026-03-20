<%*
// === Daily Note Folder Trigger ===
// Fires on new file creation in the Daily Notes folder.
// Only applies the template if the filename matches YYYY-MM-DD format.
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
if (!DATE_REGEX.test(tp.file.title)) { return; }
-%>
---
Author: Scott Novis
tags:
  - DailyNote
Version: 20
---
# <% moment(tp.file.title, "YYYY-MM-DD").format("MMMM Do, YYYY") %>
## <% moment(tp.file.title, "YYYY-MM-DD").format("dddd") %>
Day of Year: <% moment(tp.file.title).format("DDD") %>
***
<%*
let prevDay = tp.date.now("YYYY-MM-DD", -1, tp.file.title, "YYYY-MM-DD");
let nextDay = tp.date.now("YYYY-MM-DD", 1, tp.file.title, "YYYY-MM-DD");
const thisWeek = moment(tp.file.title,"YYYY-MM-DD");
const startOfWeek = thisWeek.clone().startOf('isoweek');
const endOfWeek = thisWeek.clone().endOf('isoweek');
const startDateStr = startOfWeek.format("YYYY-MM-DD");
const endDateStr = endOfWeek.format("YYYY-MM-DD");
const dateCode = thisWeek.format("YYYYMMDD");

%>**Prev Date**: [[<% prevDay %>]]
**Next Date**: [[<% nextDay  %>]]
***

## 📜 Quotes
>

## 🪴 Habits
- [ ] Pray - Meditate
- [ ] Daily Devotional
- [ ] Readwise Review
- [ ] Bible Study
- [ ] Write
- [ ] Walk / Exercise
- [ ] YNAB
- [ ] Close The Day

## 📝 Notes


## 🎯 Tasks


## 📓 Logs
