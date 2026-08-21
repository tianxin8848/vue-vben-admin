export interface CalendarCell {
  day: null | number;
  date: string;
}

export interface MonthData {
  month: number;
  monthName: string;
  cells: CalendarCell[];
  rows: CalendarCell[][];
}

export interface CalendarRecord {
  id: string;
  employee_name: string;
  employee_department: null | string;
  leave_type: string;
  approval_status: string;
  session: string;
  date_keys: string[];
}

export interface SearchForm {
  team?: string;
  region?: string;
  employee_keyword?: string;
  approval_status?: string;
  risk_threshold?: number;
  view_mode: 'detail' | 'standard';
}

export interface Props {
  dayMap: Record<string, CalendarRecord[]>;
  selectedDateKey: string;
  currentYear: number;
  searchForm: SearchForm;
}

export const WEEK_KEYS = [
  'mon',
  'tue',
  'wed',
  'thu',
  'fri',
  'sat',
  'sun',
] as const;

export const leaveTypeColorMap: Record<string, string> = {
  annual: '#60a5fa',
  personal: '#fb923c',
  sick: '#f87171',
  lieu: '#4ade80',
  long: '#a78bfa',
};

export function generateMonthCells(
  year: number,
  month: number,
): CalendarCell[] {
  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDayOfWeek = new Date(year, month - 1, 1).getDay();
  const offset = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

  const cells: CalendarCell[] = [];

  for (let i = 0; i < offset; i++) {
    cells.push({ day: null, date: '' });
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const mm = String(month).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    cells.push({ day: d, date: `${year}-${mm}-${dd}` });
  }

  while (cells.length % 7 !== 0) {
    cells.push({ day: null, date: '' });
  }

  return cells;
}

export function getLeaveTypeColor(type: string, status?: string) {
  const baseColor = leaveTypeColorMap[type] || '#94a3b8';
  if (status === 'approved' || !status) return baseColor;
  const hex = baseColor.replace('#', '');
  const r = Number.parseInt(hex.slice(0, 2), 16);
  const g = Number.parseInt(hex.slice(2, 4), 16);
  const b = Number.parseInt(hex.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, 0.55)`;
}

export function isWeekend(dateKey: string): boolean {
  if (!dateKey) return false;
  const d = new Date(`${dateKey}T00:00:00`);
  const day = d.getDay();
  return day === 0 || day === 6;
}

export function getDisplayLimit(entryCount: number): number {
  if (entryCount <= 2) return 2;
  if (entryCount <= 4) return 3;
  return 2;
}

export function getVisibleEntries(entries: CalendarRecord[]): CalendarRecord[] {
  const limit = getDisplayLimit(entries.length);
  return entries.slice(0, limit);
}

export function getMoreCount(entries: CalendarRecord[]): number {
  const limit = getDisplayLimit(entries.length);
  return Math.max(0, entries.length - limit);
}

export function getUniqueLeaveTypes(entries: CalendarRecord[]): string[] {
  return [...new Set(entries.map((e) => e.leave_type))];
}
