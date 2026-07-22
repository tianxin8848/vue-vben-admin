<script lang="ts" setup>
import type {
  WorkbenchProjectItem,
  WorkbenchQuickNavItem,
  WorkbenchTodoItem,
  WorkbenchTrendItem,
} from '@vben/common-ui';

import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import {
  WorkbenchHeader,
  WorkbenchQuickNav,
  WorkbenchTodo,
  WorkbenchTrends,
} from '@vben/common-ui';
import { preferences } from '@vben/preferences';
import { useUserStore } from '@vben/stores';
import { openWindow } from '@vben/utils';

import {
  getAnnualLeaveSummaryApi,
  getMyApprovalRecordsApi,
  getMyPendingApprovalsApi,
} from '#/api';

const userStore = useUserStore();

const quickNavItems = ref<WorkbenchQuickNavItem[]>([
  {
    color: '#1fdaca',
    icon: 'ion:home-outline',
    title: '首页',
    url: '/',
  },
  {
    color: '#bf0c2c',
    icon: 'ion:grid-outline',
    title: '仪表盘',
    url: '/analytics',
  },
  {
    color: '#3fb27f',
    icon: 'ion:users-outline',
    title: '员工管理',
    url: '/employees/list',
  },
  {
    color: '#e18525',
    icon: 'ion:calendar-outline',
    title: '请假管理',
    url: '/leave/list',
  },
  {
    color: '#4daf1bc9',
    icon: 'ion:key-outline',
    title: '审批管理',
    url: '/leave/approvals',
  },
  {
    color: '#00d8ff',
    icon: 'ion:settings-outline',
    title: '系统设置',
    url: '/settings',
  },
]);

const todoItems = ref<WorkbenchTodoItem[]>([]);
const trendItems = ref<WorkbenchTrendItem[]>([]);
const annualLeaveSummary = ref({
  entitlement_days: 0,
  used_days: 0,
  available_days: 0,
});

const router = useRouter();

function navTo(nav: WorkbenchProjectItem | WorkbenchQuickNavItem) {
  if (nav.url?.startsWith('http')) {
    openWindow(nav.url);
    return;
  }
  if (nav.url?.startsWith('/')) {
    router.push(nav.url).catch((error) => {
      console.error('Navigation failed:', error);
    });
  } else {
    console.warn(`Unknown URL for navigation item: ${nav.title} -> ${nav.url}`);
  }
}

const leaveTypeNameMap: Record<string, string> = {
  annual: '年假',
  personal: '事假',
  sick: '病假',
  lieu: '调休',
  long: '长假',
};

const actionNameMap: Record<string, string> = {
  submitted: '提交了',
  approved: '批准了',
  rejected: '拒绝了',
  withdrawn: '撤回了',
};

onMounted(async () => {
  try {
    const [pendingApprovals, approvalRecords, summary] = await Promise.all([
      getMyPendingApprovalsApi(),
      getMyApprovalRecordsApi(),
      getAnnualLeaveSummaryApi(),
    ]);

    annualLeaveSummary.value = summary;

    todoItems.value = pendingApprovals.slice(0, 5).map((item) => ({
      id: item.id,
      completed: false,
      content: `${item.employee_name} 申请了 ${leaveTypeNameMap[item.leave_type]} (${item.start_date} ~ ${item.end_date})`,
      date: item.created_at || '',
      title: `${leaveTypeNameMap[item.leave_type]}审批`,
    }));

    trendItems.value = approvalRecords.slice(0, 9).map((item) => ({
      id: item.id,
      avatar: 'svg:avatar-1',
      content: `${actionNameMap[item.action]} ${item.employee_name} 的 ${leaveTypeNameMap[item.leave_type]}申请`,
      date: item.created_at
        ? new Date(item.created_at).toLocaleString('zh-CN')
        : '',
      title: item.operator_name || item.operator_username,
    }));
  } catch (error) {
    console.error('Failed to load workbench data:', error);
  }
});
</script>

<template>
  <div class="p-5">
    <WorkbenchHeader
      :avatar="userStore.userInfo?.avatar || preferences.app.defaultAvatar"
    >
      <template #title>
        早安, {{ userStore.userInfo?.realName }}, 开始您一天的工作吧！
      </template>
      <template #description>
        年假剩余: {{ annualLeaveSummary.available_days }}天 | 已用:
        {{ annualLeaveSummary.used_days }}天
      </template>
    </WorkbenchHeader>

    <div class="mt-5 flex flex-col lg:flex-row">
      <div class="mr-4 w-full lg:w-3/5">
        <WorkbenchTrends :items="trendItems" class="mt-5" title="审批动态" />
      </div>
      <div class="w-full lg:w-2/5">
        <WorkbenchQuickNav
          :items="quickNavItems"
          class="mt-5 lg:mt-0"
          title="快捷导航"
          @click="navTo"
        />
        <WorkbenchTodo :items="todoItems" class="mt-5" title="待审批" />
      </div>
    </div>
  </div>
</template>
