<script lang="ts" setup>
import { computed, ref } from 'vue';

import { ElButton, ElCalendar, ElCard } from 'element-plus';

import cnHolidayData from '#/data/holiday/CN-holiday.json';
import hkHolidayData from '#/data/holiday/hk-holiday.json';

interface CalendarRecord {
  id: string;
  employee_name: string;
  leave_type: string;
  approval_status: string;
  session: string;
}

interface Props {
  dayMap: Record<string, CalendarRecord[]>;
  selectedDateKey: string;
  currentYear: number;
  searchForm: {
    risk_threshold: number;
    view_mode: 'detail' | 'standard';
  };
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'panelChange' | 'selectDate', date: Date): void;
}>();

const currentView = ref<'month' | 'year'>('year');
const selectedMonth = ref(new Date().getMonth());

const cnHolidayDates = new Set(
  cnHolidayData.days
    .filter((day: { date: string; isOffDay: boolean }) => day.isOffDay)
    .map((day: { date: string }) => day.date),
);

const hkHolidayDates = new Set(
  Object.keys(hkHolidayData as Record<string, string>),
);

function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getHolidayInfo(date: Date) {
  const key = toDateKey(date);
  const isCN = cnHolidayDates.has(key);
  const isHK = hkHolidayDates.has(key);
  return {
    isCNHoliday: isCN,
    isHKHoliday: isHK,
    isHoliday: isCN || isHK,
  };
}

function getHolidayName(date: Date): string {
  const key = toDateKey(date);
  const hkData = hkHolidayData as Record<string, string>;
  if (hkHolidayDates.has(key)) {
    const name = hkData[key];
    if (!name) return '';
    if (name.includes('｜')) {
      return name.split('｜')[0] || '';
    }
    return name;
  }
  if (cnHolidayDates.has(key)) {
    const day = cnHolidayData.days.find(
      (d: { date: string }) => d.date === key,
    );
    return day?.name || '';
  }
  return '';
}

function getDayInfo(date: Date) {
  const key = toDateKey(date);
  const records = props.dayMap[key] || [];
  const isRisk = records.length >= props.searchForm.risk_threshold;
  return {
    records,
    count: records.length,
    isRisk,
  };
}

const months = computed(() => {
  return Array.from({ length: 12 }, (_, i) => ({
    month: i,
    label: `${i + 1}月`,
    date: new Date(props.currentYear, i, 1),
  }));
});

const currentMonthDate = computed(() => {
  return new Date(props.currentYear, selectedMonth.value, 1);
});

function getDayClass(date: Date) {
  const key = toDateKey(date);
  const holidayInfo = getHolidayInfo(date);
  const dayInfo = getDayInfo(date);
  const classes: string[] = [];

  if (holidayInfo.isCNHoliday) {
    classes.push('holiday-cn');
  }
  if (holidayInfo.isHKHoliday) {
    classes.push('holiday-hk');
  }
  if (dayInfo.count > 0) {
    classes.push('has-leave');
  }
  if (dayInfo.isRisk) {
    classes.push('is-risk');
  }
  if (date.getDay() === 0 || date.getDay() === 6) {
    classes.push('is-weekend');
  }
  if (key === props.selectedDateKey) {
    classes.push('is-selected');
  }

  return classes.join(' ');
}

function handleDateClick(date: Date) {
  emit('selectDate', date);
}

function toggleView() {
  currentView.value = currentView.value === 'month' ? 'year' : 'month';
  if (currentView.value === 'month') {
    selectedMonth.value = new Date().getMonth();
  }
}
</script>

<template>
  <ElCard class="card calendar-panel">
    <template #header>
      <div
        style="
          display: flex;
          align-items: center;
          justify-content: space-between;
        "
      >
        <h3>
          {{
            currentView === 'month'
              ? `${currentYear}年${selectedMonth + 1}月`
              : `${currentYear}年`
          }}
        </h3>
        <ElButton type="primary" size="small" @click="toggleView">
          {{ currentView === 'month' ? '切换到年视图' : '切换到月视图' }}
        </ElButton>
      </div>
    </template>

    <div v-if="currentView === 'year'" class="year-view">
      <div class="month-grid">
        <div
          v-for="m in months"
          :key="m.month"
          class="month-card"
          @click="
            currentView = 'month';
            selectedMonth = m.month;
          "
        >
          <h4>{{ m.label }}</h4>
          <ElCalendar
            :model-value="m.date"
            @select="handleDateClick"
            class="mini-calendar"
          >
            <template #date-cell="{ data }">
              <div :class="getDayClass(data.date)" class="day-cell">
                <span class="day-number">{{ data.day }}</span>
                <span
                  v-if="getHolidayName(data.date)"
                  class="holiday-name"
                  :class="{
                    'holiday-cn': getHolidayInfo(data.date).isCNHoliday,
                    'holiday-hk': getHolidayInfo(data.date).isHKHoliday,
                  }"
                  >{{ getHolidayName(data.date) }}</span>
                <span
                  v-if="
                    getDayInfo(data.date).count > 0 &&
                    searchForm.view_mode === 'detail'
                  "
                  class="leave-count"
                  >{{ getDayInfo(data.date).count }}</span>
              </div>
            </template>
          </ElCalendar>
        </div>
      </div>
    </div>

    <div v-else class="month-view">
      <div
        style="
          display: flex;
          justify-content: space-between;
          margin-bottom: 16px;
        "
      >
        <ElButton
          size="small"
          @click="selectedMonth = Math.max(0, selectedMonth - 1)"
          :disabled="selectedMonth === 0"
        >
          上一月
        </ElButton>
        <span style="font-size: 16px; font-weight: 600">{{ currentYear }}年{{ selectedMonth + 1 }}月</span>
        <ElButton
          size="small"
          @click="selectedMonth = Math.min(11, selectedMonth + 1)"
          :disabled="selectedMonth === 11"
        >
          下一月
        </ElButton>
      </div>
      <ElCalendar
        :model-value="currentMonthDate"
        @select="handleDateClick"
        class="full-calendar"
      >
        <template #date-cell="{ data }">
          <div :class="getDayClass(data.date)" class="day-cell">
            <span class="day-number">{{ data.day }}</span>
            <span
              v-if="getHolidayName(data.date)"
              class="holiday-name"
              :class="{
                'holiday-cn': getHolidayInfo(data.date).isCNHoliday,
                'holiday-hk': getHolidayInfo(data.date).isHKHoliday,
              }"
              >{{ getHolidayName(data.date) }}</span>
            <span
              v-if="
                getDayInfo(data.date).count > 0 &&
                searchForm.view_mode === 'detail'
              "
              class="leave-count"
              >{{ getDayInfo(data.date).count }}</span>
          </div>
        </template>
      </ElCalendar>
    </div>

    <div class="hint">
      当前使用 Element Plus 日历组件（UTC+8
      时区），点击日期可查看当天详细明细。<br />
      节假日标记：<span style="color: #ef4444">红色标签（港）</span>表示香港节假日，<span style="color: #3b82f6">蓝色标签（国）</span>表示中国内地节假日。<br />
      请假状态：<span
        style="
          padding: 2px 8px;
          background: rgb(96 165 250 / 10%);
          border-radius: 4px;
        "
        >浅蓝色背景</span>表示有请假记录，<span
        style="padding: 2px 8px; border: 1px solid #ef4444; border-radius: 4px"
        >红色边框</span>表示风险日。<br />
      提示：当前月份（7月）只有 7月1日
      香港特别行政区成立纪念日是节假日，可切换到1月、2月、5月等月份查看更多节假日。
    </div>
  </ElCard>
</template>

<style scoped>
.calendar-panel {
  .year-view {
    .month-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
    }

    .month-card {
      cursor: pointer;
      transition: transform 0.2s;

      &:hover {
        transform: scale(1.02);
      }

      h4 {
        margin-bottom: 8px;
        font-size: 14px;
        color: #374151;
        text-align: center;
      }

      .mini-calendar {
        width: 100%;
      }
    }
  }

  .month-view {
    .full-calendar {
      width: 100%;
    }
  }
}

.day-cell {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  min-height: 50px;
  padding: 4px;
  text-align: center;
  border-radius: 4px;
}

.day-number {
  font-size: 14px;
  font-weight: 500;
  color: #374151;
}

.holiday-name {
  max-width: 100%;
  margin-top: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 9px;
  font-weight: bold;
  white-space: nowrap;
}

.holiday-name.holiday-cn {
  color: #3b82f6;
}

.holiday-name.holiday-hk {
  color: #ef4444;
}

.leave-count {
  position: absolute;
  top: 2px;
  right: 2px;
  min-width: 16px;
  padding: 0 4px;
  font-size: 10px;
  color: #fff;
  text-align: center;
  background: #ef4444;
  border-radius: 8px;
}

:deep(.holiday-cn .day-number) {
  font-weight: bold !important;
  color: #3b82f6 !important;
}

:deep(.holiday-hk .day-number) {
  font-weight: bold !important;
  color: #ef4444 !important;
}

:deep(.holiday-cn) {
  background-color: rgb(59 130 246 / 8%) !important;
}

:deep(.holiday-hk) {
  background-color: rgb(239 68 68 / 8%) !important;
}

:deep(.has-leave) {
  background-color: rgb(96 165 250 / 10%) !important;
}

:deep(.is-risk) {
  border: 2px solid #ef4444 !important;
}

:deep(.is-selected) {
  background-color: #2563eb !important;

  .day-number {
    color: #fff !important;
  }

  .holiday-name {
    color: #fff !important;
  }
}

:deep(.is-weekend) {
  background-color: #f8fafc !important;
}
</style>
