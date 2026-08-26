<script lang="ts" setup>
import type { WorkbenchQuickNavItem } from '@vben/common-ui';

import { computed } from 'vue';
import { useRouter } from 'vue-router';

import { Page, WorkbenchQuickNav } from '@vben/common-ui';

import {
  ElCard,
  ElDescriptions,
  ElDescriptionsItem,
  ElTag,
} from 'element-plus';

import { $t } from '#/locales';

const router = useRouter();

interface AccessItem {
  description: string;
  name: string;
  path: string;
}

const accessItems = computed<AccessItem[]>(() => [
  {
    name: $t('page.workspace.accessNav.employeeWorkspace'),
    path: '/employee',
    description: $t('page.workspace.accessNav.employeeWorkspaceDesc'),
  },
  {
    name: $t('page.workspace.accessNav.leaveRequest'),
    path: '/employee/leave',
    description: $t('page.workspace.accessNav.leaveRequestDesc'),
  },
  {
    name: $t('page.workspace.accessNav.approvalRecords'),
    path: '/employee/approvals',
    description: $t('page.workspace.accessNav.approvalRecordsDesc'),
  },
  {
    name: $t('page.workspace.accessNav.claimRequest'),
    path: '/employee/claims',
    description: $t('page.workspace.accessNav.claimRequestDesc'),
  },
  {
    name: $t('page.workspace.accessNav.leaveDetail'),
    path: '/employee/leave/detail/:id',
    description: $t('page.workspace.accessNav.leaveDetailDesc'),
  },
]);

// 系统参数管理配置快捷导航：点击跳转到 settings 页面对应分区
const settingsQuickNavItems = computed<WorkbenchQuickNavItem[]>(() => [
  {
    color: '#1fdaca',
    icon: 'ion:settings-outline',
    title: $t('page.workspace.settingsNav.basic'),
    url: '/employee/manage/settings?tab=basic',
  },
  {
    color: '#bf0c2c',
    icon: 'ion:people-outline',
    title: $t('page.workspace.settingsNav.employeeFields'),
    url: '/employee/manage/settings?tab=employee',
  },
  {
    color: '#e18525',
    icon: 'ion:cash-outline',
    title: $t('page.workspace.settingsNav.claimConfig'),
    url: '/employee/manage/settings?tab=claim',
  },
  {
    color: '#3fb27f',
    icon: 'ion:calendar-outline',
    title: $t('page.workspace.settingsNav.regionalHoliday'),
    url: '/employee/manage/settings?tab=holiday',
  },
  {
    color: '#00d8ff',
    icon: 'ion:eye-outline',
    title: $t('page.workspace.settingsNav.currentPreview'),
    url: '/employee/manage/settings?tab=preview',
  },
]);

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
      :title="$t('page.workspace.settingsNav.cardTitle')"
      class="mb-4"
      @click="handleSettingsNavClick"
    />

    <ElCard shadow="never">
      <template #header>
        <span>{{ $t('page.workspace.accessNav.cardTitle') }}</span>
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
