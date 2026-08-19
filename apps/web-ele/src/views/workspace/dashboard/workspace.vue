<script lang="ts" setup>
import { Page } from '@vben/common-ui';

import {
  ElCard,
  ElDescriptions,
  ElDescriptionsItem,
  ElTag,
} from 'element-plus';

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
</script>

<template>
  <Page title="界面访问说明" description="员工工作台各功能模块入口与说明">
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
