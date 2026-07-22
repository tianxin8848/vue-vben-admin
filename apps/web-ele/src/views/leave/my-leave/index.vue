<script lang="ts" setup>
import type { LeaveRequestApi } from '#/api';

import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';

import {
  ElButton,
  ElDatePicker,
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

import {
  createLeaveRequestApi,
  getMyLeaveRequestsApi,
  withdrawLeaveRequestApi,
} from '#/api';

const router = useRouter();
const loading = ref(false);
const leaveRequests = ref<LeaveRequestApi.LeaveRequest[]>([]);

const searchForm = reactive({
  approval_status: '',
});

const showCreateModal = ref(false);
const createForm = reactive<LeaveRequestApi.CreateLeaveRequestParams>({
  leave_type: 'annual',
  start_date: '',
  end_date: '',
  reason: '',
});

const leaveTypeOptions = [
  { label: '病假', value: 'sick' },
  { label: '年假', value: 'annual' },
  { label: '事假', value: 'personal' },
  { label: '调休', value: 'lieu' },
  { label: '长假', value: 'long' },
];

const statusOptions = [
  { label: '待审批', value: 'pending' },
  { label: '已批准', value: 'approved' },
  { label: '已拒绝', value: 'rejected' },
  { label: '已撤回', value: 'withdrawn' },
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

function formatStatus(status: string) {
  return statusOptions.find((o) => o.value === status)?.label || status;
}

async function fetchLeaveRequests() {
  loading.value = true;
  try {
    const all = await getMyLeaveRequestsApi();
    if (searchForm.approval_status) {
      leaveRequests.value = all.filter((r) => r.approval_status === searchForm.approval_status);
    } else {
      leaveRequests.value = all;
    }
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  fetchLeaveRequests();
}

function handleReset() {
  searchForm.approval_status = '';
  fetchLeaveRequests();
}

function viewDetail(id: string) {
  router.push(`/leave/detail/${id}`);
}

async function handleWithdraw(id: string) {
  try {
    await withdrawLeaveRequestApi(id, { withdraw_comment: '' });
    ElMessage.success('撤回成功');
    fetchLeaveRequests();
  } catch {
    ElMessage.error('撤回失败');
  }
}

async function handleCreate() {
  if (!createForm.start_date || !createForm.end_date) {
    ElMessage.warning('请选择日期');
    return;
  }
  if (createForm.start_date > createForm.end_date) {
    ElMessage.warning('开始日期不能大于结束日期');
    return;
  }
  try {
    await createLeaveRequestApi(createForm);
    ElMessage.success('提交成功');
    showCreateModal.value = false;
    createForm.leave_type = 'annual';
    createForm.start_date = '';
    createForm.end_date = '';
    createForm.reason = '';
    fetchLeaveRequests();
  } catch {
    ElMessage.error('提交失败');
  }
}

fetchLeaveRequests();
</script>

<template>
  <div class="my-leave-page">
    <div class="page-header">
      <h2>我的请假记录</h2>
      <ElButton type="primary" @click="showCreateModal = true">
        提交请假申请
      </ElButton>
    </div>

    <ElForm :model="searchForm" inline class="search-form">
      <ElFormItem label="状态">
        <ElSelect
          v-model="searchForm.approval_status"
          placeholder="请选择"
          clearable
        >
          <ElOption
            v-for="opt in statusOptions"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </ElSelect>
      </ElFormItem>
      <ElButton type="primary" @click="handleSearch">搜索</ElButton>
      <ElButton @click="handleReset">重置</ElButton>
    </ElForm>

    <ElTable :data="leaveRequests" border stripe v-loading="loading">
      <ElTableColumn prop="leave_type" label="请假类型" width="100">
        <template #default="{ row }">
          {{ formatLeaveType(row.leave_type) }}
        </template>
      </ElTableColumn>
      <ElTableColumn prop="start_date" label="开始日期" width="120" />
      <ElTableColumn prop="end_date" label="结束日期" width="120" />
      <ElTableColumn prop="session" label="时段" width="80">
        <template #default="{ row }">
          {{ row.session === 'full_day' ? '全天' : row.session === 'morning' ? '上午' : '下午' }}
        </template>
      </ElTableColumn>
      <ElTableColumn prop="reason" label="原因" min-width="150" show-overflow-tooltip />
      <ElTableColumn prop="approval_status" label="状态" width="100">
        <template #default="{ row }">
          <ElTag :type="statusTypeMap[row.approval_status]">
            {{ formatStatus(row.approval_status) }}
          </ElTag>
        </template>
      </ElTableColumn>
      <ElTableColumn prop="created_at" label="申请时间" width="150" />
      <ElTableColumn label="操作" width="150">
        <template #default="{ row }">
          <ElButton size="small" @click="viewDetail(row.id)">详情</ElButton>
          <ElButton
            v-if="row.approval_status === 'pending'"
            size="small"
            type="danger"
            @click="handleWithdraw(row.id)"
          >
            撤回
          </ElButton>
        </template>
      </ElTableColumn>
    </ElTable>

    <ElDialog v-model="showCreateModal" title="提交请假申请" width="500px">
      <ElForm :model="createForm" label-width="100px">
        <ElFormItem label="请假类型" required>
          <ElSelect v-model="createForm.leave_type">
            <ElOption
              v-for="opt in leaveTypeOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="开始日期" required>
          <ElDatePicker
            v-model="createForm.start_date"
            type="date"
            value-format="YYYY-MM-DD"
          />
        </ElFormItem>
        <ElFormItem label="结束日期" required>
          <ElDatePicker
            v-model="createForm.end_date"
            type="date"
            value-format="YYYY-MM-DD"
          />
        </ElFormItem>
        <ElFormItem label="请假原因">
          <ElInput v-model="createForm.reason" type="textarea" :rows="3" />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="showCreateModal = false">取消</ElButton>
        <ElButton type="primary" @click="handleCreate">提交</ElButton>
      </template>
    </ElDialog>
  </div>
</template>

<style scoped>
.my-leave-page {
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

.search-form {
  margin-bottom: 20px;
  padding: 16px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}
</style>