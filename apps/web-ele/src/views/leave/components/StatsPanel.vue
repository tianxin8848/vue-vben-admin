<script lang="ts" setup>
import { computed } from 'vue';

import { useI18n } from '@vben/locales';

interface Stats {
  visibleEmployeeCount: number;
  leaveRecordCount: number;
  riskDayCount: number;
  peakDayText: string;
}

interface AnnualLeaveSummary {
  available_days: number;
  entitlement_days: number;
  used_days: number;
  year: number;
}

interface StatTile {
  /** 仅「风险日期」为真时用危险色强调，其余保持常规前景色 */
  danger?: boolean;
  key: string;
  label: string;
  value: number | string;
}

const props = defineProps<{
  annualLeaveSummary?: AnnualLeaveSummary | null;
  stats: Stats;
}>();

const { t } = useI18n();

/**
 * 概览指标：与系统参数管理页的分区卡片同一套语言——描边 + muted 底色 + 无阴影，
 * 指标卡不再嵌套 ElCard，避免在一张卡内出现两层阴影叠加。
 */
const tiles = computed<StatTile[]>(() => [
  {
    key: 'members',
    label: t('page.leave.calendarView.stats.visibleMembers'),
    value: props.stats.visibleEmployeeCount,
  },
  {
    key: 'records',
    label: t('page.leave.calendarView.stats.annualLeaveRecords'),
    value: props.stats.leaveRecordCount,
  },
  {
    key: 'risk',
    label: t('page.leave.calendarView.stats.riskDayCount'),
    value: props.stats.riskDayCount,
    danger: props.stats.riskDayCount > 0,
  },
  {
    key: 'peak',
    label: t('page.leave.calendarView.stats.peakDate'),
    value: props.stats.peakDayText,
  },
  {
    key: 'total',
    label: t('page.leave.calendarView.stats.annualLeaveTotal'),
    value: props.annualLeaveSummary?.entitlement_days ?? '-',
  },
  {
    key: 'available',
    label: t('page.leave.calendarView.stats.annualLeaveAvailable'),
    value: props.annualLeaveSummary?.available_days ?? '-',
  },
]);
</script>

<template>
  <div class="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
    <div
      v-for="tile in tiles"
      :key="tile.key"
      class="rounded-lg border border-border bg-muted/40 px-4 py-3"
    >
      <p class="truncate text-xs text-muted-foreground" :title="tile.label">
        {{ tile.label }}
      </p>
      <p
        :class="tile.danger ? 'text-destructive' : 'text-foreground'"
        class="mt-1.5 text-2xl font-semibold tabular-nums"
      >
        {{ tile.value }}
      </p>
    </div>
  </div>
</template>
