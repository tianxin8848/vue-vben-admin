<script lang="ts" setup>
import type { LeaveRequestApi } from '#/api';

import { reactive, ref } from 'vue';

import {
  ElForm,
  ElFormItem,
  ElSelect,
  ElTable,
  ElTableColumn,
  ElTag,
} from 'element-plus';

import { getMyApprovalRecordsApi } from '#/api';

const loading = ref(false);
const records = ref<LeaveRequestApi.ApprovalRecord[]>([]);

const searchForm = reactive({
  action: '',
});

const leaveTypeOptions: Record<string, string> = {
  sick: '病假',
  annual: '年假',
  personal: '事假',
  lieu: '调休',
  long: '长假',
};

const actionOptions = [
  { label: '全部', value: '' },
  { label: '已批准', value: 'approved' },
  { label: '已拒绝', value: 'rejected' },
  { label: '已提交', value: 'submitted' },
  { label: '已撤回', value: 'withdrawn' },
];

const actionTypeMap: Record<string, 'danger' | 'info' | 'success' | 'warning'> = {
  approved: 'success',
  rejected: 'danger',
  submitted: 'warning',
  withdrawn: 'info',
};

const statusOptions: Record<string, string> = {
  pending: '待审批',
  approved: '已批准',
  rejected: '已拒绝',
  withdrawn: '已撤回',
};

function formatLeaveType(type: string) {
  return leaveTypeOptions[type] || type;
}

function formatAction(action: string) {
  return actionOptions.find((o) => o.value === action)?.label || action;
}

async function fetchRecords() {
  loading.value = true;
  try {
    const all = await getMyApprovalRecordsApi();
    if (searchForm.action) {
      records.value = all.filter((r) => r.action === searchForm.action);
    } else {
      records.value = all;
    }
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  fetchRecords();
}

function handleReset() {
  searchForm.action = '';
  fetchRecords();
}

fetchRecords();
</script>

<template>
  <div class="my-records-page">
    <div class="page-header">
      <h2>我的审批记录</h2>
    </div>

    <ElForm :model="searchForm" inline class="search-form">
      <ElFormItem label="操作类型">
        <ElSelect
          v-model="searchForm.action"
          placeholder="请选择"
          clearable
        >
          <ElOption
            v-for="opt in actionOptions"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </ElSelect>
      </ElFormItem>
      <ElButton type="primary" @click="handleSearch">搜索</ElButton>
      <ElButton @click="handleReset">重置</ElButton>
    </ElForm>

    <div v-if="records.length === 0" class="empty-state">
      <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#c0c4cc" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /></svg>
      <p>暂无审批记录</p>
    </div>

    <ElTable v-else :data="records" border stripe v-loading="loading">
      <ElTableColumn prop="employee_name" label="申请人" width="120" />
      <ElTableColumn prop="leave_type" label="请假类型" width="100">
        <template #default="{ row }">
          {{ formatLeaveType(row.leave_type) }}
        </template>
      </ElTableColumn>
      <ElTableColumn prop="start_date" label="开始日期" width="120" />
      <ElTableColumn prop="end_date" label="结束日期" width="120" />
      <ElTableColumn prop="action" label="操作类型" width="100">
        <template #default="{ row }">
          <ElTag :type="actionTypeMap[row.action]">
            {{ formatAction(row.action) }}
          </ElTag>
        </template>
      </ElTableColumn>
      <ElTableColumn prop="approval_status_after" label="操作后状态" width="100">
        <template #default
="{ row }">
          {{ statusOptions[row.approval_status_after] }}
        </template>
      </ElTableColumn>
      <ElTableColumn prop="comment" label="操作意见" min-width="150" show-overflow-tooltip>
        <template #default="{ row }">
          {{ row.comment || '-' }}
        </template>
      </ElTableColumn>
      <ElTableColumn prop="created_at" label="操作时间" width="150" />
    </ElTable>
  </div>
</template>

<style scoped>
.my-records-page {
  padding: 24px;
  background: #f5f5f5;
  min-height: calc(100vh - 80px);
}

.page-header {
  margin-bottom: 20px;
}

.page-header h2 {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.search-form {
  margin-bottom: 20px;
  padding: 16px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.empty-state {
  text-align: center;
  padding: 60px 0;
  color: #909399;
}

.empty-state svg {
  margin-bottom: 16px;
}

.empty-state p {
  font-size: 16px;
  margin: 0;
}
</style>
