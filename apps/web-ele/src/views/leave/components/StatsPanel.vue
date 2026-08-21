<script lang="ts" setup>
import { ElCard, ElTag } from 'element-plus';

import { $t } from '#/locales';

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

interface Props {
  stats: Stats;
  annualLeaveSummary?: AnnualLeaveSummary | null;
}

defineProps<Props>();
</script>

<template>
  <div
    style="
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 16px;
    "
  >
    <ElCard shadow="hover">
      <div
        style="
          display: flex;
          align-items: center;
          justify-content: space-between;
        "
      >
        <div>
          <div style="font-size: 13px; color: #64748b">
            {{ $t('page.leave.calendarView.stats.visibleMembers') }}
          </div>
          <div style="margin-top: 8px; font-size: 28px; font-weight: 700">
            {{ stats.visibleEmployeeCount }}
          </div>
        </div>
        <ElTag type="primary" size="large" effect="dark">
          {{ stats.visibleEmployeeCount }}
        </ElTag>
      </div>
    </ElCard>
    <ElCard shadow="hover">
      <div
        style="
          display: flex;
          align-items: center;
          justify-content: space-between;
        "
      >
        <div>
          <div style="font-size: 13px; color: #64748b">
            {{ $t('page.leave.calendarView.stats.annualLeaveRecords') }}
          </div>
          <div style="margin-top: 8px; font-size: 28px; font-weight: 700">
            {{ stats.leaveRecordCount }}
          </div>
        </div>
        <ElTag type="success" size="large" effect="dark">
          {{ stats.leaveRecordCount }}
        </ElTag>
      </div>
    </ElCard>
    <ElCard shadow="hover">
      <div
        style="
          display: flex;
          align-items: center;
          justify-content: space-between;
        "
      >
        <div>
          <div style="font-size: 13px; color: #64748b">
            {{ $t('page.leave.calendarView.stats.riskDayCount') }}
          </div>
          <div style="margin-top: 8px; font-size: 28px; font-weight: 700">
            {{ stats.riskDayCount }}
          </div>
        </div>
        <ElTag type="danger" size="large" effect="dark">
          {{ stats.riskDayCount }}
        </ElTag>
      </div>
    </ElCard>
    <ElCard shadow="hover">
      <div
        style="
          display: flex;
          align-items: center;
          justify-content: space-between;
        "
      >
        <div>
          <div style="font-size: 13px; color: #64748b">
            {{ $t('page.leave.calendarView.stats.peakDate') }}
          </div>
          <div style="margin-top: 8px; font-size: 28px; font-weight: 700">
            {{ stats.peakDayText }}
          </div>
        </div>
        <ElTag type="warning" size="large" effect="dark">
          {{ stats.peakDayText.split(' · ')[0] }}
        </ElTag>
      </div>
    </ElCard>
    <ElCard shadow="hover">
      <div
        style="
          display: flex;
          align-items: center;
          justify-content: space-between;
        "
      >
        <div>
          <div style="font-size: 13px; color: #64748b">
            {{ $t('page.leave.calendarView.stats.annualLeaveTotal') }}
          </div>
          <div style="margin-top: 8px; font-size: 28px; font-weight: 700">
            {{ annualLeaveSummary?.entitlement_days ?? '-' }}
          </div>
        </div>
        <ElTag type="info" size="large" effect="dark">
          {{ annualLeaveSummary?.entitlement_days ?? '-' }}
        </ElTag>
      </div>
    </ElCard>
    <ElCard shadow="hover">
      <div
        style="
          display: flex;
          align-items: center;
          justify-content: space-between;
        "
      >
        <div>
          <div style="font-size: 13px; color: #64748b">
            {{ $t('page.leave.calendarView.stats.annualLeaveAvailable') }}
          </div>
          <div style="margin-top: 8px; font-size: 28px; font-weight: 700">
            {{ annualLeaveSummary?.available_days ?? '-' }}
          </div>
        </div>
        <ElTag type="success" size="large" effect="dark">
          {{ annualLeaveSummary?.available_days ?? '-' }}
        </ElTag>
      </div>
    </ElCard>
  </div>
</template>
