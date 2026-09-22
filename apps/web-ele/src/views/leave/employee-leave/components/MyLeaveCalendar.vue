<script lang="ts" setup>
import type { LeaveRequestApi } from '#/api';

import { computed, ref } from 'vue';

import { ElCard } from 'element-plus';

import { $t } from '#/locales';

import CalendarPanel from '../../components/CalendarPanel.vue';
import { leaveTypeLabelOverride } from '../../shared/leave-types';
import { createSessionOptions, createStatusOptions } from '../data';

defineProps<{
  /** 年历基准年份 */
  currentYear: number;
  /** 日期 → 当日请假条目 */
  dayMap: Record<string, LeaveRequestApi.LeaveRequest[]>;
}>();

// 请假类型映射：直接用接口 system-settings.leave_types（code → 显示文本）
const leaveTypeOptions = leaveTypeLabelOverride;
const sessionOptions = computed(() => createSessionOptions($t));
const statusOptions = computed(() => createStatusOptions($t));

// 选中日期（YYYY-MM-DD），仅年历视图本地状态
const selectedDateKey = ref('');

// 日期选择
function onSelectDate(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  selectedDateKey.value = `${y}-${m}-${d}`;
}
</script>

<template>
  <ElCard class="flex-1" style="margin-top: 0">
    <template #header>
      <div
        style="
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          align-items: center;
          justify-content: space-between;
        "
      ></div>
    </template>

    <!-- 年历面板 -->
    <CalendarPanel
      :day-map="dayMap"
      :selected-date-key="selectedDateKey"
      :current-year="currentYear"
      :search-form="{ view_mode: 'standard' }"
      @select-date="onSelectDate"
      @panel-change="() => {}"
    />

    <!-- 日期详情 -->
    <div
      v-if="selectedDateKey"
      style="
        padding: 16px;
        margin-top: 16px;
        background: hsl(var(--muted));
        border-radius: 14px;
      "
    >
      <h4 style="margin: 0 0 12px; font-size: 16px">
        {{ selectedDateKey }} ·
        {{ $t('page.leave.employeeLeave.calendar.detailTitle') }}
      </h4>
      <div
        v-if="!dayMap[selectedDateKey]?.length"
        style="color: hsl(var(--muted-foreground))"
      >
        {{ $t('page.leave.employeeLeave.calendar.noRecords') }}
      </div>
      <div v-else style="display: flex; flex-direction: column; gap: 10px">
        <div
          v-for="item in dayMap[selectedDateKey]"
          :key="item.id"
          style="
            padding: 10px 0;
            font-size: 14px;
            line-height: 1.7;
            border-top: 1px solid hsl(var(--border));
          "
        >
          <div>
            {{ $t('page.leave.employeeLeave.calendar.typeLabel')
            }}{{ leaveTypeOptions[item.leave_type] }}
          </div>
          <div>
            {{ $t('page.leave.employeeLeave.calendar.sessionLabel')
            }}{{ sessionOptions[item.session] }}
          </div>
          <div>
            {{ $t('page.leave.employeeLeave.calendar.statusLabel')
            }}{{ statusOptions[item.approval_status] }}
          </div>
          <div>
            {{ $t('page.leave.employeeLeave.calendar.reasonLabel')
            }}{{ item.reason || '-' }}
          </div>
        </div>
      </div>
    </div>
  </ElCard>
</template>
