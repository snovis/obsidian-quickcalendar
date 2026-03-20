import { App } from 'obsidian';
import { CalendarView, QuickCalendarConfig, MonthData } from '../types';
import { BaseRenderer } from './base-renderer';
import { GridRenderer } from './grid-renderer';
import { RowRenderer } from './row-renderer';
import { StreamRenderer } from './stream-renderer';
import { ListRenderer } from './list-renderer';

/**
 * Renderer registry.
 *
 * To add a new view type:
 * 1. Create a new renderer class extending BaseRenderer
 * 2. Add it to this map
 * 3. Add the view name to the CalendarView type in types.ts
 */
const RENDERERS: Record<CalendarView, new (
  app: App,
  config: QuickCalendarConfig,
  months: MonthData[],
  dailyNoteSettings: { folder: string; format: string; template: string },
  weeklyNoteTemplate?: string,
) => BaseRenderer> = {
  grid: GridRenderer,
  row: RowRenderer,
  stream: StreamRenderer,
  list: ListRenderer,
};

/** Create a renderer for the given view type */
export function createRenderer(
  view: CalendarView,
  app: App,
  config: QuickCalendarConfig,
  months: MonthData[],
  dailyNoteSettings: { folder: string; format: string; template: string },
  weeklyNoteTemplate: string = '',
): BaseRenderer {
  const RendererClass = RENDERERS[view];
  if (!RendererClass) {
    throw new Error(`Unknown QuickCalendar view: ${view}`);
  }
  return new RendererClass(app, config, months, dailyNoteSettings, weeklyNoteTemplate);
}

/** Get list of available view types */
export function getAvailableViews(): CalendarView[] {
  return Object.keys(RENDERERS) as CalendarView[];
}
