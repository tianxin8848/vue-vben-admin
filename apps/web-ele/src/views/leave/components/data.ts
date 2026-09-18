import { getLeaveTypeColor as getBaseLeaveTypeColor } from '../shared/leave-types';

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

/** 区域假日项（与 system-settings 中 RegionalHolidayItem 对应） */
export interface RegionalHoliday {
  date: string;
  holiday_name: string;
  region: string;
  /**
   * 是否为调休补班日（周末补班）。
   * - true：周末但需上班 → 工作日
   * - false / 缺省：休息日（法定假日或普通周末）
   * 后端如未提供该字段，按缺省（休息日）处理。
   */
  is_workday?: boolean;
}

export interface Props {
  dayMap: Record<string, CalendarRecord[]>;
  selectedDateKey: string;
  currentYear: number;
  searchForm: SearchForm;
  /** 区域假日列表；个人视角可不传 */
  regionalHolidays?: RegionalHoliday[];
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
  const baseColor = getBaseLeaveTypeColor(type);
  if (status === 'approved' || !status) return baseColor;
  const hex = baseColor.replace('#', '');
  const r = Number.parseInt(hex.slice(0, 2), 16);
  const g = Number.parseInt(hex.slice(2, 4), 16);
  const b = Number.parseInt(hex.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, 0.55)`;
}

/** 类型色的浅色底（约 12% 透明度），用于月视图请假条目的 chip 背景 */
export function getLeaveTypeTint(type: string, status?: string): string {
  const base = getLeaveTypeColor(type, status);
  const nums = base.match(/[\d.]+/g);
  if (!nums || nums.length < 3) return 'rgba(148, 163, 184, 0.12)';
  const [r, g, b] = nums.map(Number);
  return `rgba(${r}, ${g}, ${b}, 0.12)`;
}

export function isWeekend(dateKey: string): boolean {
  if (!dateKey) return false;
  const d = new Date(`${dateKey}T00:00:00`);
  const day = d.getDay();
  return day === 0 || day === 6;
}

/**
 * 判断某日是否为休息日。
 * 规则：
 *   1. 若当日匹配到区域假日记录：
 *      - is_workday === true → 调休补班日 → 工作日（返回 false）
 *      - 否则 → 法定假日 → 休息日（返回 true）
 *   2. 无假日记录时，周末 → 休息日，工作日 → 工作日
 * @param dateKey  YYYY-MM-DD
 * @param holidays 已按当前地区过滤的假日列表
 */
export function isRestDay(
  dateKey: string,
  holidays: RegionalHoliday[] = [],
): boolean {
  if (!dateKey) return false;
  const matched = holidays.find((h) => h.date === dateKey);
  if (matched) return matched.is_workday !== true;
  return isWeekend(dateKey);
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
