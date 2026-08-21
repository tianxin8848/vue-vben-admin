<script lang="ts" setup>
import type { CalendarCell, MonthData, Props } from './data';

import { computed, ref, watch } from 'vue';

import { ElButton, ElDatePicker } from 'element-plus';

import { $t } from '#/locales';

import {
  generateMonthCells,
  getLeaveTypeColor,
  getMoreCount,
  getUniqueLeaveTypes,
  getVisibleEntries,
  isWeekend,
  WEEK_KEYS,
} from './data';

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'panelChange' | 'selectDate', date: Date): void;
}>();

function getEntriesForDate(dateKey: string) {
  return props.dayMap[dateKey] || [];
}

const WEEK_DAYS = computed(() =>
  WEEK_KEYS.map((k) => $t(`page.leave.calendarView.weekShort.${k}`) as string),
);
const MONTH_NAMES = computed(() => {
  const names = $t('page.leave.calendarView.monthNames');
  return Array.isArray(names) ? names : [];
});

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
  const months: MonthData[] = [];

  for (let m = 1; m <= 12; m++) {
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

// const yearSummary = computed(() => {
//   const year = selectedYear.value;
//   let recordCount = 0;
//   let pendingCount = 0;
//
//   const seenDates = new Set<string>();
//   Object.entries(props.dayMap).forEach(([dateKey, entries]) => {
//     if (!dateKey.startsWith(`${year}-`)) return;
//     if (entries.length > 0) {
//       seenDates.add(dateKey);
//     }
//   });
//
//   Object.values(props.dayMap).forEach((entries) => {
//     entries.forEach((entry) => {
//       if (
//         (entry.date_keys || []).some((dk: string) => dk.startsWith(`${year}-`))
//       ) {
//         recordCount++;
//         if (entry.approval_status === 'pending') {
//           pendingCount++;
//         }
//       }
//     });
//   });
//
//   const dayCount = seenDates.size;
//
//   return { dayCount, pendingCount, recordCount };
// });

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
      <!-- <div class="year-summary-bar">
        <div class="summary-item">
          <div class="summary-value">{{ yearSummary.recordCount }}</div>
          <div class="summary-label">
            {{ $t('page.leave.calendarView.summary.leaveRecords') }}
          </div>
        </div>
        <div class="summary-item">
          <div class="summary-value">{{ yearSummary.dayCount }}</div>
          <div class="summary-label">
            {{ $t('page.leave.calendarView.summary.coveredDays') }}
          </div>
        </div>
        <div class="summary-item">
          <div class="summary-value">{{ yearSummary.pendingCount }}</div>
          <div class="summary-label">
            {{ $t('page.leave.calendarView.summary.pending') }}
          </div>
        </div>
        <div class="summary-item">
          <div class="summary-value">{{ selectedYear }}</div>
          <div class="summary-label">
            {{ $t('page.leave.calendarView.summary.currentYear') }}
          </div>
        </div>
      </div> -->

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

<style scoped src="./CalendarPanel.css"></style>
