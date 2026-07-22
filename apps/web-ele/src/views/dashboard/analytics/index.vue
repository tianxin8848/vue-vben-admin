<script lang="ts" setup>
import type { AnalysisOverviewItem } from '@vben/common-ui';

import { computed, onMounted, ref } from 'vue';

import { AnalysisChartCard, AnalysisOverview } from '@vben/common-ui';
import {
  SvgBellIcon,
  SvgCakeIcon,
  SvgCardIcon,
  SvgDownloadIcon,
} from '@vben/icons';

import {
  getAnnualLeaveSummaryApi,
  getEmployeesApi,
  getLeaveRequestsApi,
  getMyPendingApprovalsApi,
} from '#/api';

import AnalyticsVisitsSales from './analytics-visits-sales.vue';
import AnalyticsVisitsSource from './analytics-visits-source.vue';

const totalEmployees = ref(0);
const activeEmployees = ref(0);
const totalLeaveRequests = ref(0);
const pendingLeaveRequests = ref(0);
const approvedLeaveRequests = ref(0);
const pendingApprovals = ref(0);
const annualLeaveSummary = ref({
  entitlement_days: 0,
  used_days: 0,
  available_days: 0,
});

const overviewItems = computed<AnalysisOverviewItem[]>(() => [
  {
    icon: SvgCardIcon,
    title: '员工总数',
    totalTitle: '活跃员工',
    totalValue: activeEmployees.value,
    value: totalEmployees.value,
  },
  {
    icon: SvgCakeIcon,
    title: '请假总数',
    totalTitle: '已批准',
    totalValue: approvedLeaveRequests.value,
    value: totalLeaveRequests.value,
  },
  {
    icon: SvgDownloadIcon,
    title: '待审批',
    totalTitle: '剩余年假',
    totalValue: annualLeaveSummary.value.available_days,
    value: pendingApprovals.value,
  },
  {
    icon: SvgBellIcon,
    title: '待处理',
    totalTitle: '年假已用',
    totalValue: annualLeaveSummary.value.used_days,
    value: pendingLeaveRequests.value,
  },
]);

const leaveTypeCounts = ref<{ name: string; value: number }[]>([]);
const departmentCounts = ref<{ name: string; value: number }[]>([]);

onMounted(async () => {
  try {
    const [employees, leaveRequests, summary, pending] = await Promise.all([
      getEmployeesApi(),
      getLeaveRequestsApi(),
      getAnnualLeaveSummaryApi(new Date().getFullYear()),
      getMyPendingApprovalsApi(),
    ]);

    totalEmployees.value = employees.length;
    activeEmployees.value = employees.length;
    totalLeaveRequests.value = leaveRequests.length;
    pendingLeaveRequests.value = leaveRequests.filter(
      (r) => r.approval_status === 'pending',
    ).length;
    approvedLeaveRequests.value = leaveRequests.filter(
      (r) => r.approval_status === 'approved',
    ).length;
    pendingApprovals.value = pending.length;
    annualLeaveSummary.value = summary;

    const typeMap: Record<string, number> = {};
    const deptMap: Record<string, number> = {};
    leaveRequests.forEach((r) => {
      const typeName =
        {
          annual: '年假',
          personal: '事假',
          sick: '病假',
          lieu: '调休',
          long: '长假',
        }[r.leave_type] || r.leave_type;
      typeMap[typeName] = (typeMap[typeName] || 0) + 1;

      const deptName = r.employee_department || '未知部门';
      deptMap[deptName] = (deptMap[deptName] || 0) + 1;
    });

    leaveTypeCounts.value = Object.entries(typeMap).map(([name, value]) => ({
      name,
      value,
    }));

    departmentCounts.value = Object.entries(deptMap)
      .map(([name, value]) => ({ name, value }))
      .toSorted((a, b) => b.value - a.value)
      .slice(0, 6);
  } catch (error) {
    console.error('Failed to load dashboard data:', error);
  }
});
</script>

<template>
  <div class="p-5">
    <AnalysisOverview :items="overviewItems" />

    <div class="mt-5 w-full md:flex">
      <AnalysisChartCard
        class="mt-5 md:mt-0 md:mr-4 md:w-1/3"
        title="请假类型分布"
      >
        <AnalyticsVisitsSource :data="leaveTypeCounts" />
      </AnalysisChartCard>
      <AnalysisChartCard class="mt-5 md:mt-0 md:w-1/3" title="部门请假统计">
        <AnalyticsVisitsSales :data="departmentCounts" />
      </AnalysisChartCard>
    </div>
  </div>
</template>
