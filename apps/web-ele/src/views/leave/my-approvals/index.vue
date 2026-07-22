<script lang="ts" setup>
import type { LeaveRequestApi } from '#/api';

import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';

import {
  ElButton,
  ElDialog,
  ElForm,
  ElFormItem,
  ElInput,
  ElMessage,
  ElSelect,
  ElTable,
  ElTableColumn,
  ElTag,
} from 'element-plus';

import { getMyPendingApprovalsApi, reviewLeaveRequestApi } from '#/api';

const router = useRouter();
const loading = ref(false);
const leaveRequests = ref<LeaveRequestApi.LeaveRequest[]>([]);

const searchForm = reactive({
  leave_type: '',
});

const showReviewModal = ref(false);
const reviewComment = ref('');
const currentRequestId = ref('');

const leaveTypeOptions = [
  { label: '病假', value: 'sick' },
  { label: '年假', value: 'annual' },
  { label: '事假', value: 'personal' },
  { label: '调休', value: 'lieu' },
  { label: '长假', value: 'long' },
];

const statusTypeMap: Record<string, 'success' | 'warning' | 'danger' | 'info'> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'danger',
  withdrawn: 'info',
};

function formatLeaveType(type: string) {
  return leaveTypeOptions.find((o) => o.value === type)?.label || type;
}

async function fetchApprovals() {
  loading.value = true;
  try {
    const all = await getMyPendingApprovalsApi();
    if (searchForm.leave_type) {
      leaveRequests.value = all.filter((r) => r.leave_type === searchForm.leave_type);
    } else {
      leaveRequests.value = all;
    }
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  fetchApprovals();
}

function handleReset() {
  searchForm.leave_type = '';
  fetchApprovals();
}

function viewDetail(id: string) {
  router.push(`/leave/detail/${id}`);
}

function openReviewModal(id: string) {
  currentRequestId.value = id;
  reviewComment.value = '';
  showReviewModal.value = true;
}

async function handleApprove() {
  try {
    await reviewLeaveRequestApi(currentRequestId.value, {
      approval_status: 'approved',
      review_comment: reviewComment.value,
    });
    ElMessage.success('审批通过');
    showReviewModal.value = false;
    fetchApprovals();
  } catch {
    ElMessage.error('审批失败');
  }
}

async function handleReject() {
  if (!reviewComment.value.trim()) {
    ElMessage.warning('请填写拒绝理由');
    return;
  }
  try {
    await reviewLeaveRequestApi(currentRequestId.value, {
      approval_status: 'rejected',
      review_comment: reviewComment.value,
    });
    ElMessage.success('已拒绝');
    showReviewModal.value = false;
    fetchApprovals();
  } catch {
    ElMessage.error('操作失败');
  }
}

fetchApprovals();
</script>

<template>
  <div class="my-approvals-page">
    <div class="page-header">
      <h2>我的待审批</h2>
      <span class="pending-count">{{ leaveRequests.length }} 条待处理</span>
    </div>

    <ElForm :model="searchForm" inline class="search-form">
      <ElFormItem label="请假类型">
        <ElSelect
          v-model="searchForm.leave_type"
          placeholder="请选择"
          clearable
        >
          <ElOption
            v-for="opt in leaveTypeOptions"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </ElSelect>
      </ElFormItem>
      <ElButton type="primary" @click="handleSearch">搜索</ElButton>
      <ElButton @click="handleReset">重置</ElButton>
    </ElForm>

    <div v-if="leaveRequests.length === 0" class="empty-state">
      <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#c0c4cc" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
      <p>暂无待审批的请假申请</p>
    </div>

    <ElTable v-else :data="leaveRequests" border stripe v-loading="loading">
      <ElTableColumn prop="employee_name" label="申请人" width="120" />
      <ElTableColumn prop="employee_department" label="部门" width="120" />
      <ElTableColumn prop="leave_type" label="请假类型" width="100">
        <template #default="{ row }">
          {{ formatLeaveType(row.leave_type) }}
        </template>
      </ElTableColumn>
      <ElTableColumn prop="start_date" label="开始日期" width="120" />
      <ElTableColumn prop="end_date" label="结束日期" width="120" />
      <ElTableColumn prop="reason" label="原因" min-width="200" show-overflow-tooltip />
      <ElTableColumn prop="created_at" label="申请时间" width="150" />
      <ElTableColumn label="操作" width="180">
        <template #default="{ row }">
          <ElButton size="small" @click="viewDetail(row.id)">详情</ElButton>
          <ElButton size="small" type="primary" @click="openReviewModal(row.id)">审批</ElButton>
        </template>
      </ElTableColumn>
    </ElTable>

    <ElDialog v-model="showReviewModal" title="审批请假申请" width="500px">
      <ElForm label-width="80px">
        <ElFormItem label="审批意见">
          <ElInput v-model="reviewComment" type="textarea" :rows="4" placeholder="请输入审批意见..." />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="showReviewModal = false">取消</ElButton>
        <ElButton type="danger" @click="handleReject">拒绝</ElButton>
        <ElButton type="primary" @click="handleApprove">同意</ElButton>
      </template>
    </ElDialog>
  </div>
</template>

<style scoped>
.my-approvals-page {
  padding: 24px;
  background: #f5f5f5;
  min-height: calc(100vh - 80px);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h2 {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.pending-count {
  background: #fef3c7;
  color: #d97706;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
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
