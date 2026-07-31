<script lang="ts" setup>
import { computed, ref, watch } from 'vue';

import { ElButton, ElDatePicker } from 'element-plus';

interface CalendarCell {
  day: null | number;
  date: string;
}

interface MonthData {
  month: number;
  monthName: string;
  cells: CalendarCell[];
  rows: CalendarCell[][];
}

interface CalendarRecord {
  id: string;
  employee_name: string;
  employee_department: null | string;
  leave_type: string;
  approval_status: string;
  session: string;
  date_keys: string[];
}

interface SearchForm {
  team?: string;
  region?: string;
  employee_keyword?: string;
  approval_status?: string;
  risk_threshold?: number;
  view_mode: 'detail' | 'standard';
}

interface Props {
  dayMap: Record<string, CalendarRecord[]>;
  selectedDateKey: string;
  currentYear: number;
  searchForm: SearchForm;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'panelChange' | 'selectDate', date: Date): void;
}>();

const WEEK_DAYS = ['一', '二', '三', '四', '五', '六', '日'];
const MONTH_NAMES = [
  '一月',
  '二月',
  '三月',
  '四月',
  '五月',
  '六月',
  '七月',
  '八月',
  '九月',
  '十月',
  '十一月',
  '十二月',
];

const leaveTypeColorMap: Record<string, string> = {
  annual: '#60a5fa',
  personal: '#fb923c',
  sick: '#f87171',
  lieu: '#4ade80',
  long: '#a78bfa',
};

const selectedYear = ref(2026);
const selectedMonth = ref(7);
const viewMode = ref<'month' | 'year'>('month');
const yearMonthValue = ref('2026-07');

watch(
  () => props.currentYear,
  (val) => {
    if (val) {
      selectedYear.value = val;
      yearMonthValue.value = `${val}-${String(selectedMonth.value).padStart(2, '0')}`;
    }
  },
  { immediate: true },
);

watch(viewMode, (val) => {
  if (val === 'year') {
    selectedYear.value = props.currentYear;
  }
});

function onYearMonthChange(val: null | string) {
  if (!val) return;
  const [y, m] = val.split('-');
  selectedYear.value = Number(y);
  selectedMonth.value = Number(m);
  emit('panelChange', new Date(Number(y), Number(m) - 1, 1));
}

function toggleViewMode() {
  viewMode.value = viewMode.value === 'month' ? 'year' : 'month';
  if (viewMode.value === 'year') {
    emit('panelChange', new Date(selectedYear.value, 0, 1));
  }
}

function selectMonth(month: number) {
  selectedMonth.value = month;
  viewMode.value = 'month';
  yearMonthValue.value = `${selectedYear.value}-${String(month).padStart(2, '0')}`;
  emit('panelChange', new Date(selectedYear.value, month - 1, 1));
}

function generateMonthCells(year: number, month: number): CalendarCell[] {
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

const calendarRows = computed(() => {
  const cells = generateMonthCells(selectedYear.value, selectedMonth.value);
  const rows: CalendarCell[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    rows.push(cells.slice(i, i + 7));
  }
  return rows;
});

const yearCalendarData = computed<MonthData[]>(() => {
  const year = selectedYear.value;
  const months: MonthData[] = [];

  for (let m = 1; m <= 12; m++) {
    const cells = generateMonthCells(year, m);
    const rows: CalendarCell[][] = [];
    for (let i = 0; i < cells.length; i += 7) {
      rows.push(cells.slice(i, i + 7));
    }
    const idx = m - 1;
    const monthName = MONTH_NAMES[idx] || '';
    months.push({
      month: m,
      monthName,
      cells,
      rows,
    });
  }

  return months;
});

const yearSummary = computed(() => {
  const year = selectedYear.value;
  let recordCount = 0;
  let pendingCount = 0;

  const seenDates = new Set<string>();
  Object.entries(props.dayMap).forEach(([dateKey, entries]) => {
    if (!dateKey.startsWith(`${year}-`)) return;
    if (entries.length > 0) {
      seenDates.add(dateKey);
    }
  });

  Object.values(props.dayMap).forEach((entries) => {
    entries.forEach((entry) => {
      if (
        (entry.date_keys || []).some((dk: string) => dk.startsWith(`${year}-`))
      ) {
        recordCount++;
        if (entry.approval_status === 'pending') {
          pendingCount++;
        }
      }
    });
  });

  const dayCount = seenDates.size;

  return { dayCount, pendingCount, recordCount };
});

function getLeaveTypeColor(type: string, status?: string) {
  const baseColor = leaveTypeColorMap[type] || '#94a3b8';
  if (status === 'approved' || !status) return baseColor;
  const hex = baseColor.replace('#', '');
  const r = Number.parseInt(hex.slice(0, 2), 16);
  const g = Number.parseInt(hex.slice(2, 4), 16);
  const b = Number.parseInt(hex.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, 0.55)`;
}

function getEntriesForDate(dateKey: string): CalendarRecord[] {
  return props.dayMap[dateKey] || [];
}

function isWeekend(dateKey: string): boolean {
  if (!dateKey) return false;
  const d = new Date(`${dateKey}T00:00:00`);
  const day = d.getDay();
  return day === 0 || day === 6;
}

function isRiskDay(dateKey: string): boolean {
  const entries = getEntriesForDate(dateKey);
  return entries.length >= (props.searchForm.risk_threshold || 5);
}

function isSelected(dateKey: string): boolean {
  return props.selectedDateKey === dateKey;
}

function onCellClick(cell: CalendarCell) {
  if (!cell.day || !cell.date) return;
  const d = new Date(`${cell.date}T00:00:00`);
  emit('selectDate', d);
}

function getDisplayLimit(entryCount: number): number {
  if (entryCount <= 2) return 2;
  if (entryCount <= 4) return 3;
  return 2;
}

function getVisibleEntries(entries: CalendarRecord[]): CalendarRecord[] {
  const limit = getDisplayLimit(entries.length);
  return entries.slice(0, limit);
}

function getMoreCount(entries: CalendarRecord[]): number {
  const limit = getDisplayLimit(entries.length);
  return Math.max(0, entries.length - limit);
}

function getUniqueLeaveTypes(entries: CalendarRecord[]): string[] {
  return [...new Set(entries.map((e) => e.leave_type))];
}

function goPrevYear() {
  selectedYear.value--;
  yearMonthValue.value = `${selectedYear.value}-${String(selectedMonth.value).padStart(2, '0')}`;
  emit('panelChange', new Date(selectedYear.value, selectedMonth.value - 1, 1));
}

function goNextYear() {
  selectedYear.value++;
  yearMonthValue.value = `${selectedYear.value}-${String(selectedMonth.value).padStart(2, '0')}`;
  emit('panelChange', new Date(selectedYear.value, selectedMonth.value - 1, 1));
}

function goCurrentYear() {
  const now = new Date();
  selectedYear.value = now.getFullYear();
  selectedMonth.value = now.getMonth() + 1;
  yearMonthValue.value = `${selectedYear.value}-${String(selectedMonth.value).padStart(2, '0')}`;
  emit('panelChange', now);
}
</script>

<template>
  <div class="calendar-panel">
    <div class="calendar-header">
      <div class="calendar-header-left">
        <ElDatePicker
          v-model="yearMonthValue"
          type="month"
          format="YYYY 年 MM 月"
          value-format="YYYY-MM"
          placeholder="选择年月"
          :clearable="false"
          style="width: 200px"
          @change="onYearMonthChange"
        />
        <ElButton size="small" @click="toggleViewMode">
          {{ viewMode === 'month' ? '年视图' : '月视图' }}
        </ElButton>
      </div>
      <div v-if="viewMode === 'year'" class="calendar-header-right">
        <ElButton size="small" @click="goPrevYear">上一年</ElButton>
        <span class="year-badge">{{ selectedYear }}</span>
        <ElButton size="small" @click="goNextYear">下一年</ElButton>
        <ElButton size="small" type="primary" @click="goCurrentYear">
回到今年
</ElButton>
      </div>
    </div>

    <!-- 月视图 -->
    <div v-if="viewMode === 'month'">
      <div class="month-view-grid">
        <div class="week-header">
          <div
            v-for="(label, idx) in WEEK_DAYS"
            :key="idx"
            class="week-day-label"
          >
            周{{ label }}
          </div>
        </div>
        <div
          v-for="(row, rowIdx) in calendarRows"
          :key="rowIdx"
          class="week-row"
        >
          <div
            v-for="(cell, cellIdx) in row"
            :key="cellIdx"
            class="calendar-cell"
            :class="{
              'is-empty': !cell.day,
              'is-weekend': cell.day && isWeekend(cell.date),
              'is-selected': cell.day && isSelected(cell.date),
              'has-leave': cell.day && getEntriesForDate(cell.date).length > 0,
              'is-risk': cell.day && isRiskDay(cell.date),
            }"
            @click="onCellClick(cell)"
          >
            <template v-if="cell.day">
              <div class="cell-top">
                <span class="day-number">{{ cell.day }}</span>
                <span
                  v-if="getEntriesForDate(cell.date).length > 0"
                  class="day-badge"
                >
                  {{ getEntriesForDate(cell.date).length }}
                </span>
              </div>
              <div class="leave-list">
                <div
                  v-for="entry in getVisibleEntries(
                    getEntriesForDate(cell.date),
                  )"
                  :key="entry.id"
                  class="leave-item"
                  :class="{ dimmed: entry.approval_status === 'pending' }"
                >
                  <span
                    class="type-dot"
                    :style="{
                      background: getLeaveTypeColor(
                        entry.leave_type,
                        entry.approval_status,
                      ),
                    }"
                  ></span>
                  <span class="leave-name">{{ entry.employee_name }}</span>
                </div>
                <div
                  v-if="getMoreCount(getEntriesForDate(cell.date)) > 0"
                  class="more-line"
                >
                  +{{ getMoreCount(getEntriesForDate(cell.date)) }}
                </div>
              </div>
              <div
                v-if="getEntriesForDate(cell.date).length > 0"
                class="day-bars"
              >
                <span
                  v-for="type in getUniqueLeaveTypes(
                    getEntriesForDate(cell.date),
                  )"
                  :key="type"
                  class="day-bar"
                  :style="{ background: getLeaveTypeColor(type, 'approved') }"
                ></span>
              </div>
            </template>
          </div>
        </div>
      </div>
    </div>

    <!-- 年视图 -->
    <div v-else>
      <div class="year-summary-bar">
        <div class="summary-item">
          <div class="summary-value">{{ yearSummary.recordCount }}</div>
          <div class="summary-label">请假记录</div>
        </div>
        <div class="summary-item">
          <div class="summary-value">{{ yearSummary.dayCount }}</div>
          <div class="summary-label">覆盖天数</div>
        </div>
        <div class="summary-item">
          <div class="summary-value">{{ yearSummary.pendingCount }}</div>
          <div class="summary-label">待审批</div>
        </div>
        <div class="summary-item">
          <div class="summary-value">{{ selectedYear }}</div>
          <div class="summary-label">当前年份</div>
        </div>
      </div>

      <div class="year-grid">
        <div
          v-for="monthData in yearCalendarData"
          :key="monthData.month"
          class="month-card"
          @click="selectMonth(monthData.month)"
        >
          <div class="month-title">{{ monthData.monthName }}</div>
          <div class="mini-calendar">
            <div class="mini-week-header">
              <div
                v-for="(day, idx) in WEEK_DAYS"
                :key="idx"
                class="mini-week-day"
              >
                {{ day }}
              </div>
            </div>
            <div class="mini-body">
              <div
                v-for="(row, rowIdx) in monthData.rows"
                :key="rowIdx"
                class="mini-row"
              >
                <div
                  v-for="(cell, cellIdx) in row"
                  :key="cellIdx"
                  class="mini-cell"
                  :class="{
                    'is-empty': !cell.day,
                    'is-weekend': cell.day && isWeekend(cell.date),
                    'is-selected': cell.day && isSelected(cell.date),
                    'has-leave':
                      cell.day && getEntriesForDate(cell.date).length > 0,
                    'is-risk': cell.day && isRiskDay(cell.date),
                  }"
                  @click.stop="onCellClick(cell)"
                >
                  <template v-if="cell.day">
                    <span class="mini-day-number">{{ cell.day }}</span>
                    <span
                      v-if="getEntriesForDate(cell.date).length > 0"
                      class="mini-badge"
                    >
                      {{ getEntriesForDate(cell.date).length }}
                    </span>
                    <div
                      v-if="getEntriesForDate(cell.date).length > 0"
                      class="mini-dots"
                    >
                      <span
                        v-for="type in getUniqueLeaveTypes(
                          getEntriesForDate(cell.date),
                        )"
                        :key="type"
                        class="mini-dot"
                        :style="{
                          background: getLeaveTypeColor(type, 'approved'),
                        }"
                      ></span>
                    </div>
                  </template>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.calendar-panel {
  width: 100%;
}

.calendar-header {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.calendar-header-left {
  display: flex;
  gap: 10px;
  align-items: center;
}

.calendar-header-right {
  display: flex;
  gap: 8px;
  align-items: center;
}

.year-badge {
  display: inline-block;
  min-width: 60px;
  padding: 4px 12px;
  font-size: 15px;
  font-weight: 700;
  color: #2563eb;
  text-align: center;
  background: #eff6ff;
  border-radius: 6px;
}

/* ===== 月视图 ===== */
.month-view-grid {
  overflow: hidden;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

.week-header {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}

.week-day-label {
  padding: 10px 0;
  font-size: 13px;
  font-weight: 600;
  color: #64748b;
  text-align: center;
}

.week-row {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  border-bottom: 1px solid #f1f5f9;
}

.week-row:last-child {
  border-bottom: none;
}

.calendar-cell {
  position: relative;
  min-height: 90px;
  padding: 6px;
  cursor: pointer;
  border-right: 1px solid #f1f5f9;
  transition: background 0.15s;
}

.calendar-cell:last-child {
  border-right: none;
}

.calendar-cell:hover:not(.is-empty) {
  background: #f8fafc;
}

.calendar-cell.is-empty {
  cursor: default;
  background: #fafbfc;
}

.calendar-cell.is-weekend {
  background: #f8fafc;
}

.calendar-cell.is-selected {
  outline: 2px solid #3b82f6;
  outline-offset: -2px;
  background: #eff6ff;
}

.calendar-cell.is-risk {
  border: 2px solid #ef4444;
}

.calendar-cell.has-leave {
  background: #f0f9ff;
}

.cell-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
}

.day-number {
  font-size: 14px;
  font-weight: 600;
  color: #0f172a;
}

.day-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 5px;
  font-size: 11px;
  font-weight: 600;
  color: #fff;
  background: #3b82f6;
  border-radius: 10px;
}

.leave-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.leave-item {
  display: flex;
  gap: 4px;
  align-items: center;
  padding: 1px 2px;
  font-size: 11px;
  line-height: 1.3;
  color: #334155;
  border-radius: 3px;
}

.leave-item.dimmed {
  opacity: 0.6;
}

.type-dot {
  display: inline-block;
  flex-shrink: 0;
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.leave-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.more-line {
  padding-left: 12px;
  font-size: 10px;
  color: #64748b;
}

.day-bars {
  position: absolute;
  right: 4px;
  bottom: 2px;
  left: 4px;
  display: flex;
  gap: 2px;
}

.day-bar {
  flex: 1;
  min-width: 6px;
  height: 3px;
  border-radius: 2px;
}

/* ===== 年视图 ===== */
.year-summary-bar {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 12px;
  padding: 14px 18px;
  margin-bottom: 16px;
  background: linear-gradient(135deg, #f0f9ff 0%, #eff6ff 100%);
  border: 1px solid #dbeafe;
  border-radius: 10px;
}

.summary-item {
  text-align: center;
}

.summary-value {
  font-size: 24px;
  font-weight: 700;
  color: #1e40af;
}

.summary-label {
  margin-top: 2px;
  font-size: 12px;
  color: #64748b;
}

.year-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
}

.month-card {
  padding: 8px;
  cursor: pointer;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  transition: all 0.15s;
}

.month-card:hover {
  border-color: #3b82f6;
  box-shadow: 0 2px 8px rgb(59 130 246 / 12%);
}

.month-title {
  margin-bottom: 6px;
  font-size: 13px;
  font-weight: 700;
  color: #0f172a;
  text-align: center;
}

.mini-calendar {
  display: flex;
  flex-direction: column;
}

.mini-week-header {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  margin-bottom: 2px;
}

.mini-week-day {
  padding: 1px 0;
  font-size: 10px;
  color: #94a3b8;
  text-align: center;
}

.mini-body {
  display: flex;
  flex-direction: column;
}

.mini-row {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
}

.mini-cell {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  aspect-ratio: 1;
  padding: 1px;
  font-size: 10px;
  cursor: pointer;
  border-radius: 3px;
  transition: background 0.1s;
}

.mini-cell.is-empty {
  cursor: default;
}

.mini-cell.is-weekend {
  background: #f8fafc;
}

.mini-cell.is-selected {
  outline: 1.5px solid #3b82f6;
  outline-offset: -1px;
  background: #dbeafe;
}

.mini-cell.has-leave {
  background: #eff6ff;
}

.mini-cell.is-risk {
  outline: 1.5px solid #ef4444;
  outline-offset: -1px;
}

.mini-cell:hover:not(.is-empty) {
  background: #e0e7ff;
}

.mini-day-number {
  font-size: 10px;
  line-height: 1;
  color: #334155;
}

.mini-badge {
  position: absolute;
  top: 0;
  right: 1px;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 10px;
  height: 11px;
  padding: 0 2px;
  font-size: 8px;
  font-weight: 700;
  line-height: 1;
  color: #fff;
  background: #3b82f6;
  border-radius: 6px;
}

.mini-dots {
  display: flex;
  gap: 1px;
  margin-top: 1px;
}

.mini-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
}
</style>
