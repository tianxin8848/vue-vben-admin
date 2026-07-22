<script lang="ts" setup>
import { computed } from 'vue';
import { ElCard } from 'element-plus';
import { Calendar as ArcoCalendar } from '@arco-design/web-vue';

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
    view_mode: 'standard' | 'detail';
  };
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'selectDate', date: Date): void;
  (e: 'panelChange', date: Date): void;
}>();

const leaveTypeConfig: Record<string, { color: string; label: string; }> = {
  annual: { label: '年假', color: '#60a5fa' },
  personal: { label: '事假', color: '#fb923c' },
  sick: { label: '病假', color: '#f87171' },
  lieu: { label: '调休', color: '#4ade80' },
  long: { label: '长假', color: '#a78bfa' },
};

const approvalStatusConfig: Record<string, { label: string; opacity: number }> = {
  approved: { label: '已通过', opacity: 1 },
  pending: { label: '待审批', opacity: 0.5 },
  rejected: { label: '已驳回', opacity: 0.45 },
  withdrawn: { label: '已撤回', opacity: 0.35 },
};

function toUTC8DateKey(date: Date): string {
  const utc8 = new Date(date.getTime() + 8 * 3600 * 1000);
  const y = utc8.getUTCFullYear();
  const m = String(utc8.getUTCMonth() + 1).padStart(2, '0');
  const d = String(utc8.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function fromUTC8DateKey(key: string): Date {
  const parts = key.split('-').map(Number) as [number, number, number];
  const y = parts[0];
  const m = parts[1];
  const d = parts[2];
  return new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0) - 8 * 3600 * 1000);
}

const calendarValue = computed({
  get() {
    if (props.selectedDateKey) return fromUTC8DateKey(props.selectedDateKey);
    const now = new Date(Date.now() + 8 * 3600 * 1000);
    return fromUTC8DateKey(`${props.currentYear}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')}`);
  },
  set(val: Date) {
    emit('selectDate', val);
  },
});

function onSelectDate(date: Date) {
  emit('selectDate', date);
}

function onPanelChange(date: Date) {
  emit('panelChange', date);
}

function getEntriesForDate(date: Date): CalendarRecord[] {
  const key = toUTC8DateKey(date);
  return props.dayMap[key] || [];
}

function cellClassForDate(date: Date) {
  const key = toUTC8DateKey(date);
  const entries = props.dayMap[key] || [];
  const d = new Date(date.getTime() + 8 * 3600 * 1000);
  const dayOfWeek = d.getUTCDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  return {
    'has-leave': entries.length > 0,
    'is-risk': entries.length >= props.searchForm.risk_threshold,
    'is-selected': props.selectedDateKey === key,
    'is-weekend': isWeekend,
  };
}

function getLeaveTypeColor(type: string, status: string) {
  const baseColor = leaveTypeConfig[type]?.color || '#94a3b8';
  const opacity = approvalStatusConfig[status]?.opacity ?? 1;
  if (opacity === 1) return baseColor;
  const hex = baseColor.replace('#', '');
  const red = Number.parseInt(hex.slice(0, 2), 16);
  const green = Number.parseInt(hex.slice(2, 4), 16);
  const blue = Number.parseInt(hex.slice(4, 6), 16);
  return `rgba(${red}, ${green}, ${blue}, ${opacity})`;
}

function getSessionShortLabel(session: string) {
  if (session === 'morning') return '上';
  if (session === 'afternoon') return '下';
  return '';
}

function getDisplayLimit(entryCount: number) {
  if (props.searchForm.view_mode === 'detail') return 4;
  if (entryCount <= 2) return 2;
  if (entryCount <= 4) return 3;
  return 2;
}
</script>

<template>
  <ElCard class="card calendar-panel">
    <template #header>
      <h3>年历视图</h3>
    </template>

    <ArcoCalendar v-model="calendarValue" @select="onSelectDate" @panel-change="onPanelChange">
      <template #cell="{ date }">
        <div class="arco-cell-custom" :class="cellClassForDate(date)">
          <span class="cell-day-num">{{ date.getDate() }}</span>
          <template v-if="getEntriesForDate(date).length">
            <span class="cell-count-badge">{{ getEntriesForDate(date).length }}</span>
            <div class="cell-leave-list">
              <div
                v-for="(entry, idx) in getEntriesForDate(date).slice(0, getDisplayLimit(getEntriesForDate(date).length))"
                :key="idx"
                class="cell-leave-item"
                :class="{ dimmed: entry.approval_status === 'pending' }"
              >
                <span class="cell-type-dot" :style="{ background: getLeaveTypeColor(entry.leave_type, entry.approval_status) }"></span>
                <span class="cell-leave-name">{{ entry.employee_name }}</span>
                <span v-if="getSessionShortLabel(entry.session)" class="cell-leave-session">{{ getSessionShortLabel(entry.session) }}</span>
              </div>
              <div v-if="getEntriesForDate(date).length > getDisplayLimit(getEntriesForDate(date).length)" class="cell-more">
                +{{ getEntriesForDate(date).length - getDisplayLimit(getEntriesForDate(date).length) }}
              </div>
            </div>
          </template>
        </div>
      </template>
    </ArcoCalendar>

    <div class="hint">
      当前已切换为 Arco Design 日历组件（UTC+8 时区），点击日期可看当天详细明细。
    </div>
  </ElCard>
</template>
