<script lang="ts" setup>
import type { WorkbenchQuickNavItem } from '@vben/common-ui';

import { useRouter } from 'vue-router';

import { Page, WorkbenchQuickNav } from '@vben/common-ui';

import {
  ElCard,
  ElDescriptions,
  ElDescriptionsItem,
  ElTag,
} from 'element-plus';

const router = useRouter();

interface AccessItem {
  description: string;
  name: string;
  path: string;
}

const accessItems: AccessItem[] = [
  {
    name: '员工工作台',
    path: '/employee',
    description: '个人信息维护、详细档案与模块权限查看。',
  },
  {
    name: '请假申请',
    path: '/employee/leave',
    description: '员工提交请假申请，查看请假记录与状态。',
  },
  {
    name: '审批记录',
    path: '/employee/approvals',
    description: '审批人查看待审批与已审批的请假记录。',
  },
  {
    name: '报销申请',
    path: '/employee/claims',
    description: '员工提交报销申请，查看报销记录与状态。',
  },
  {
    name: '请假详情',
    path: '/employee/leave/detail/:id',
    description: '查看单条请假申请的详细信息，从请假列表跳转进入。',
  },
];

// 系统参数管理配置快捷导航：点击跳转到 settings 页面对应分区
const settingsQuickNavItems: WorkbenchQuickNavItem[] = [
  {
    color: '#1fdaca',
    icon: 'ion:settings-outline',
    title: '基础参数',
    url: '/employee/manage/settings?tab=basic',
  },
  {
    color: '#bf0c2c',
    icon: 'ion:people-outline',
    title: '员工字段',
    url: '/employee/manage/settings?tab=employee',
  },
  {
    color: '#e18525',
    icon: 'ion:cash-outline',
    title: '报销配置',
    url: '/employee/manage/settings?tab=claim',
  },
  {
    color: '#3fb27f',
    icon: 'ion:calendar-outline',
    title: '地区假期',
    url: '/employee/manage/settings?tab=holiday',
  },
  {
    color: '#00d8ff',
    icon: 'ion:eye-outline',
    title: '当前预览',
    url: '/employee/manage/settings?tab=preview',
  },
];

function handleSettingsNavClick(item: WorkbenchQuickNavItem) {
  if (item.url) {
    router.push(item.url);
  }
}
</script>

<template>
  <Page>
    <WorkbenchQuickNav
      :items="settingsQuickNavItems"
      title="系统参数管理配置"
      class="mb-4"
      @click="handleSettingsNavClick"
    />

    <ElCard shadow="never">
      <template #header>
        <span>功能入口导航</span>
      </template>
      <ElDescriptions :column="1" border>
        <ElDescriptionsItem
          v-for="item in accessItems"
          :key="item.path"
          :label="item.name"
        >
          <ElTag type="info" size="small">{{ item.path }}</ElTag>
          <span style="margin-left: 12px">{{ item.description }}</span>
        </ElDescriptionsItem>
      </ElDescriptions>
    </ElCard>
  </Page>
</template>
