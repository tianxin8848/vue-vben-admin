<script lang="ts" setup>
import { ElCard, ElTag } from 'element-plus';

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
  <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px;">
    <ElCard shadow="hover">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <div>
          <div style="font-size: 13px; color: #64748b;">当前展示成员</div>
          <div style="font-size: 28px; font-weight: 700; margin-top: 8px;">{{ stats.visibleEmployeeCount }}</div>
        </div>
        <ElTag type="primary" size="large" effect="dark">{{ stats.visibleEmployeeCount }}</ElTag>
      </div>
    </ElCard>
    <ElCard shadow="hover">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <div>
          <div style="font-size: 13px; color: #64748b;">全年请假记录</div>
          <div style="font-size: 28px; font-weight: 700; margin-top: 8px;">{{ stats.leaveRecordCount }}</div>
        </div>
        <ElTag type="success" size="large" effect="dark">{{ stats.leaveRecordCount }}</ElTag>
      </div>
    </ElCard>
    <ElCard shadow="hover">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <div>
          <div style="font-size: 13px; color: #64748b;">风险日期数量</div>
          <div style="font-size: 28px; font-weight: 700; margin-top: 8px;">{{ stats.riskDayCount }}</div>
        </div>
        <ElTag type="danger" size="large" effect="dark">{{ stats.riskDayCount }}</ElTag>
      </div>
    </ElCard>
    <ElCard shadow="hover">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <div>
          <div style="font-size: 13px; color: #64748b;">最高峰值日期</div>
          <div style="font-size: 28px; font-weight: 700; margin-top: 8px;">{{ stats.peakDayText }}</div>
        </div>
        <ElTag type="warning" size="large" effect="dark">{{ stats.peakDayText.split(' · ')[0] }}</ElTag>
      </div>
    </ElCard>
    <ElCard shadow="hover">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <div>
          <div style="font-size: 13px; color: #64748b;">当年年假总计</div>
          <div style="font-size: 28px; font-weight: 700; margin-top: 8px;">{{ annualLeaveSummary?.entitlement_days ?? '-' }}</div>
        </div>
        <ElTag type="info" size="large" effect="dark">{{ annualLeaveSummary?.entitlement_days ?? '-' }}</ElTag>
      </div>
    </ElCard>
    <ElCard shadow="hover">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <div>
          <div style="font-size: 13px; color: #64748b;">当年年假可用</div>
          <div style="font-size: 28px; font-weight: 700; margin-top: 8px;">{{ annualLeaveSummary?.available_days ?? '-' }}</div>
        </div>
        <ElTag type="success" size="large" effect="dark">{{ annualLeaveSummary?.available_days ?? '-' }}</ElTag>
      </div>
    </ElCard>
  </div>
</template>