<script lang="ts" setup>
import { computed, ref } from 'vue';

import { ElDatePicker, ElTable, ElTableColumn } from 'element-plus';

interface CalendarCell {
  day: null | number;
  date: string;
}

const WEEK_DAYS = ['一', '二', '三', '四', '五', '六', '日'];

const selectedYear = ref(2026);
const selectedMonth = ref(7);

const yearMonthValue = ref('2026-07');

function onYearMonthChange(val: null | string) {
  if (!val) return;
  const [y, m] = val.split('-');
  selectedYear.value = Number(y);
  selectedMonth.value = Number(m);
}

const calendarData = computed<CalendarCell[]>(() => {
  const year = selectedYear.value;
  const month = selectedMonth.value;
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
});

const calendarRows = computed(() => {
  const rows: CalendarCell[][] = [];
  for (let i = 0; i < calendarData.value.length; i += 7) {
    rows.push(calendarData.value.slice(i, i + 7));
  }
  return rows;
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
    </div>
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
</template>
