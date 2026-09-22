<script lang="ts" setup>
import type { LeaveStats } from '../composables/useLeaveData';

import { ElCard, ElCol, ElDivider, ElRow } from 'element-plus';

import { $t } from '#/locales';

defineProps<{
  stats: LeaveStats;
}>();

// 统计卡片分组配置（与 i18n key 对应）
const statGroups = [
  {
    groupKey: 'annual',
    items: [
      {
        statKey: 'annualEntitlement',
        labelKey: 'page.leave.employeeLeave.stats.annualEntitlement',
      },
      {
        statKey: 'annualLeaveAccrual',
        labelKey: 'page.leave.employeeLeave.stats.annualLeaveAccrual',
      },
      {
        statKey: 'annualUsed',
        labelKey: 'page.leave.employeeLeave.stats.annualUsed',
      },
      {
        statKey: 'annualAvailable',
        labelKey: 'page.leave.employeeLeave.stats.annualAvailable',
      },
    ],
  },
  {
    groupKey: 'lieu',
    items: [
      {
        statKey: 'lieuGranted',
        labelKey: 'page.leave.employeeLeave.stats.lieuGranted',
      },
      {
        statKey: 'lieuAvailable',
        labelKey: 'page.leave.employeeLeave.stats.lieuAvailable',
      },
      {
        statKey: 'lieuUsed',
        labelKey: 'page.leave.employeeLeave.stats.lieuUsed',
      },
    ],
  },
  {
    groupKey: 'carryover',
    items: [
      {
        statKey: 'carryForward',
        labelKey: 'page.leave.employeeLeave.stats.carryForward',
      },
      {
        statKey: 'broughtForward',
        labelKey: 'page.leave.employeeLeave.stats.broughtForward',
      },
    ],
  },
];
</script>

<template>
  <ElCard shadow="never" body-style="padding: 16px;">
    <template v-for="group in statGroups" :key="group.groupKey">
      <ElDivider content-position="left">
        {{ $t(`page.leave.employeeLeave.group.${group.groupKey}`) }}
      </ElDivider>
      <ElRow :gutter="12">
        <ElCol
          v-for="item in group.items"
          :key="item.statKey"
          :xs="24"
          :sm="12"
          :md="8"
          :lg="6"
        >
          <ElCard shadow="hover" class="mb-3" body-style="padding: 14px 16px;">
            <div class="min-h-10 text-xs leading-tight text-muted-foreground">
              {{ $t(item.labelKey) }}
            </div>
            <div class="mt-2 text-2xl font-bold">
              {{ stats[item.statKey] }}
            </div>
          </ElCard>
        </ElCol>
      </ElRow>
    </template>
  </ElCard>
</template>
