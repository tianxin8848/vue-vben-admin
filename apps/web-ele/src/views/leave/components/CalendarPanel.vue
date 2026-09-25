<script lang="ts" setup>
import type { CalendarCell, MonthData, Props, RegionalHoliday } from './data';

import { computed, ref, watch } from 'vue';

import { ElButton, ElDatePicker } from 'element-plus';

import { $t, $tm } from '#/locales';
import { regionsMatch } from '#/utils/regions';

import {
  generateMonthCells,
  getLeaveTypeColor,
  getLeaveTypeTint,
  getMoreCount,
  getUniqueLeaveTypes,
  getVisibleEntries,
  isRestDay,
  WEEK_KEYS,
} from './data';

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'panelChange' | 'selectDate', date: Date): void;
}>();

function getEntriesForDate(dateKey: string) {
  if (!props.dayMap) return [];
  return props.dayMap[dateKey] || [];
}

// 区域假日：按当前筛选地区过滤，未指定地区时展示全部
// 入口处强制归一化，避免 bootstrap 阶段 prop 短暂为 undefined 导致 forEach 崩溃
// 地区用宽松匹配（「香港」=「HK」=「Hong Kong」），与后端模板口径一致
const holidayMap = computed(() => {
  const map: Record<string, RegionalHoliday[]> = {};
  const region = props.searchForm.region;
  const filterRegion =
    region && region !== 'all' && region !== '__unset__' ? region : '';
  const holidays = Array.isArray(props.regionalHolidays)
    ? props.regionalHolidays
    : [];
  holidays.forEach((h) => {
    if (filterRegion && !regionsMatch(h.region, filterRegion)) return;
    const list = map[h.date] ?? (map[h.date] = []);
    list.push(h);
  });
  return map;
});

function getHolidaysForDate(dateKey: string): RegionalHoliday[] {
  return holidayMap.value[dateKey] || [];
}

function getHolidayLabel(holidays: RegionalHoliday[]): string {
  const names = [...new Set(holidays.map((h) => h.holiday_name))];
  return names.join(' / ');
}

const WEEK_DAYS = computed(() =>
  WEEK_KEYS.map((k) => $t(`page.leave.calendarView.weekShort.${k}`) as string),
);
const MONTH_NAMES = computed(() => {
  // monthNames 为 list 型 i18n 数据（数组），$t 会做翻译拼接返回字符串，
  // 需用 $tm 拿到原始数组，才能按下标取到各月份名称。
  const names = $tm('page.leave.calendarView.monthNames');
  return Array.isArray(names) ? names : [];
});

// 当前所选年月对应的月份名称，用于月视图导航徽标
const currentMonthName = computed(() => {
  const idx = selectedMonth.value - 1;
  return MONTH_NAMES.value[idx] || String(selectedMonth.value);
});

// 默认以系统当前年月初始化；用户在日期选择器更改后由 onYearMonthChange 覆盖
const now = new Date();
const selectedYear = ref(now.getFullYear());
const selectedMonth = ref(now.getMonth() + 1);
const viewMode = ref<'month' | 'year'>('month');
const yearMonthValue = ref(
  `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
);

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

const calendarRows = computed(() => {
  const cells = generateMonthCells(selectedYear.value, selectedMonth.value);
  const rows: CalendarCell[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    rows.push(cells.slice(i, i + 7));
  }
  return rows;
});

const yearCalendarData = computed(() => {
  const year = selectedYear.value;
  // 年视图从当前所选月份开始渲染到12月；默认（未选择）跟随系统当月
  const startMonth = selectedMonth.value;
  const months: MonthData[] = [];

  for (let m = startMonth; m <= 12; m++) {
    const cells = generateMonthCells(year, m);
    const rows: CalendarCell[][] = [];
    for (let i = 0; i < cells.length; i += 7) {
      rows.push(cells.slice(i, i + 7));
    }
    const idx = m - 1;
    const monthName = MONTH_NAMES.value[idx] || '';
    months.push({
      month: m,
      monthName,
      cells,
      rows,
    });
  }

  return months;
});

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

// 月视图：上一个月 / 下一个月，跨年自动进位（1 月 → 上一年 12 月，12 月 → 下一年 1 月）
function goPrevMonth() {
  let y = selectedYear.value;
  let m = selectedMonth.value - 1;
  if (m < 1) {
    m = 12;
    y -= 1;
  }
  selectedYear.value = y;
  selectedMonth.value = m;
  yearMonthValue.value = `${y}-${String(m).padStart(2, '0')}`;
  emit('panelChange', new Date(y, m - 1, 1));
}

function goNextMonth() {
  let y = selectedYear.value;
  let m = selectedMonth.value + 1;
  if (m > 12) {
    m = 1;
    y += 1;
  }
  selectedYear.value = y;
  selectedMonth.value = m;
  yearMonthValue.value = `${y}-${String(m).padStart(2, '0')}`;
  emit('panelChange', new Date(y, m - 1, 1));
}
</script>

<template>
  <div class="calendar-panel">
    <div class="calendar-header">
      <div class="calendar-header-left">
        <ElDatePicker
          v-model="yearMonthValue"
          type="month"
          format="YYYY-MM"
          value-format="YYYY-MM"
          :placeholder="$t('page.leave.calendarView.selectYearMonth')"
          :clearable="false"
          style="width: 200px"
          @change="onYearMonthChange"
        />
        <ElButton size="small" @click="toggleViewMode">
          {{
            viewMode === 'month'
              ? $t('page.leave.calendarView.yearView')
              : $t('page.leave.calendarView.monthView')
          }}
        </ElButton>
      </div>
      <div v-if="viewMode === 'year'" class="calendar-header-right">
        <ElButton size="small" @click="goPrevYear">
          {{ $t('page.leave.calendarView.prevYear') }}
        </ElButton>
        <span class="year-badge">{{ selectedYear }}</span>
        <ElButton size="small" @click="goNextYear">
          {{ $t('page.leave.calendarView.nextYear') }}
        </ElButton>
        <ElButton size="small" type="primary" @click="goCurrentYear">
          {{ $t('page.leave.calendarView.backToCurrentYear') }}
        </ElButton>
      </div>
      <div v-else class="calendar-header-right">
        <ElButton size="small" @click="goPrevMonth">
          {{ $t('page.leave.calendarView.prevMonth') }}
        </ElButton>
        <span class="month-badge">{{ selectedYear }} - {{ currentMonthName }}</span>
        <ElButton size="small" @click="goNextMonth">
          {{ $t('page.leave.calendarView.nextMonth') }}
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
            {{ $t('page.leave.calendarView.weekPrefix') }}{{ label }}
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
              'is-workday':
                cell.day &&
                !isRestDay(cell.date, getHolidaysForDate(cell.date)),
              'is-rest':
                cell.day && isRestDay(cell.date, getHolidaysForDate(cell.date)),
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
              <div
                v-if="getHolidaysForDate(cell.date).length > 0"
                class="holiday-tag"
                :title="getHolidayLabel(getHolidaysForDate(cell.date))"
              >
                {{ getHolidayLabel(getHolidaysForDate(cell.date)) }}
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
                  <span
                    class="leave-item-chip"
                    :style="{
                      background: getLeaveTypeTint(
                        entry.leave_type,
                        entry.approval_status,
                      ),
                    }"
                    >{{ entry.employee_name }}</span>
                </div>
                <div
                  v-if="getMoreCount(getEntriesForDate(cell.date)) > 0"
                  class="more-line"
                >
                  +{{ getMoreCount(getEntriesForDate(cell.date)) }}
                </div>
              </div>
            </template>
          </div>
        </div>
      </div>
    </div>

    <!-- 年视图 -->
    <div v-else>
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
                    'is-workday':
                      cell.day &&
                      !isRestDay(cell.date, getHolidaysForDate(cell.date)),
                    'is-rest':
                      cell.day &&
                      isRestDay(cell.date, getHolidaysForDate(cell.date)),
                    'is-selected': cell.day && isSelected(cell.date),
                    'has-leave':
                      cell.day && getEntriesForDate(cell.date).length > 0,
                    'is-risk': cell.day && isRiskDay(cell.date),
                  }"
                  :title="
                    cell.day && getHolidaysForDate(cell.date).length > 0
                      ? getHolidayLabel(getHolidaysForDate(cell.date))
                      : ''
                  "
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

<style scoped src="./CalendarPanel.css"></style>
