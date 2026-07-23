<script lang="ts" setup>
import { computed, ref } from 'vue';

import { ElDatePicker, ElTable, ElTableColumn } from 'element-plus';

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

const WEEK_DAYS = ['一', '二', '三', '四', '五', '六', '日'];
const MONTH_NAMES = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];

const selectedYear = ref(2026);
const selectedMonth = ref(7);
const viewMode = ref<'month' | 'year'>('month');

const yearMonthValue = ref('2026-07');

function onYearMonthChange(val: null | string) {
  if (!val) return;
  const [y, m] = val.split('-');
  selectedYear.value = Number(y);
  selectedMonth.value = Number(m);
}

function toggleViewMode() {
  viewMode.value = viewMode.value === 'month' ? 'year' : 'month';
}

function selectMonth(month: number) {
  selectedMonth.value = month;
  viewMode.value = 'month';
  yearMonthValue.value = `${selectedYear.value}-${String(month).padStart(2, '0')}`;
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

const calendarData = computed<CalendarCell[]>(() => {
  return generateMonthCells(selectedYear.value, selectedMonth.value);
});

const calendarRows = computed(() => {
  const rows: CalendarCell[][] = [];
  for (let i = 0; i < calendarData.value.length; i += 7) {
    rows.push(calendarData.value.slice(i, i + 7));
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
</script>

<template>
  <div>
    <div class="calendar-header">
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

    <div v-if="viewMode === 'month'">
      <ElTable :data="calendarRows" border stripe>
        <ElTableColumn label="周次" width="70" align="center">
          <template #default="{ $index }">
            第{{ $index + 1 }}周
          </template>
        </ElTableColumn>
        <ElTableColumn
          v-for="(label, idx) in WEEK_DAYS"
          :key="idx"
          :label="`周${label}`"
          min-width="100"
          align="center"
        >
          <template #default="{ row }">
            <div v-if="row[idx]?.day" class="calendar-cell">
              {{ row[idx].day }}
            </div>
          </template>
        </ElTableColumn>
      </ElTable>
    </div>

    <div v-else>
      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px;">
        <div
          v-for="monthData in yearCalendarData"
          :key="monthData.month"
          @click="selectMonth(monthData.month)"
          style="cursor: pointer;"
        >
          <div style="text-align: center; font-weight: bold; margin-bottom: 8px;">
            {{ monthData.monthName }}
          </div>
          <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
            <thead>
              <tr>
                <th v-for="(day, idx) in WEEK_DAYS" :key="idx" style="padding: 2px; text-align: center; font-weight: normal; color: #999;">
                  {{ day }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, rowIdx) in monthData.rows" :key="rowIdx">
                <td
                  v-for="(cell, cellIdx) in row"
                  :key="cellIdx"
                  style="padding: 2px; text-align: center;"
                >
                  <span v-if="cell.day">{{ cell.day }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>
