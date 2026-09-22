<script lang="ts" setup>
import { computed, ref } from 'vue';

import { Page } from '@vben/common-ui';

import { ElSegmented } from 'element-plus';

import { $t } from '#/locales';

import CreateLeaveModal from './components/CreateLeaveModal.vue';
import LeaveRecordsTable from './components/LeaveRecordsTable.vue';
import LeaveStatsPanel from './components/LeaveStatsPanel.vue';
import MyLeaveCalendar from './components/MyLeaveCalendar.vue';
import { useLeaveData } from './composables/useLeaveData';

// ─── 视图状态 ──────────────────────────────────────────────────────────────────

type TabKey = 'calendar' | 'records';

const activeTab = ref<TabKey>('records');
const segmentedOptions = computed(() => [
  { label: $t('page.leave.employeeLeave.recordsTab'), value: 'records' },
  { label: $t('page.leave.employeeLeave.calendarTab'), value: 'calendar' },
]);

// ─── 数据层（请假记录 / 年假·调休·结转汇总 / 筛选 / 年历映射与统计） ────────────

const {
  currentYear,
  dayMap,
  fetchData,
  filteredLeaveRequests,
  handleWithdraw,
  hideWithdrawnOrRejected,
  stats,
} = useLeaveData();

// ─── 新建请假弹窗 ──────────────────────────────────────────────────────────────

const modalRef = ref<InstanceType<typeof CreateLeaveModal>>();
</script>

<template>
  <Page>
    <div class="flex h-full flex-col gap-2">
      <ElSegmented v-model="activeTab" :options="segmentedOptions" />

      <!-- 统计数据 -->
      <LeaveStatsPanel
        v-show="activeTab === 'records'"
        class="mb-4 flex-shrink-0"
        :stats="stats"
      />

      <!-- 请假记录 -->
      <LeaveRecordsTable
        v-show="activeTab === 'records'"
        v-model:hide-withdrawn-or-rejected="hideWithdrawnOrRejected"
        class="min-h-0"
        :records="filteredLeaveRequests"
        @create="modalRef?.open()"
        @refresh="fetchData"
        @withdraw="handleWithdraw"
      />

      <!-- 同部门同事请假 -->

      <!-- 我的请假年历 -->
      <MyLeaveCalendar
        v-show="activeTab === 'calendar'"
        :current-year="currentYear"
        :day-map="dayMap"
      />
    </div>

    <!-- 新建请假申请 -->
    <CreateLeaveModal ref="modalRef" @success="fetchData" />
  </Page>
</template>
