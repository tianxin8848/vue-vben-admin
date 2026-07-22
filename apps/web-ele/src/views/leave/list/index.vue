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
} from 'element-plus';

import {
  createLeaveRequestApi,
  getLeaveRequestsApi,
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

function formatLeaveType(type: string) {
  return leaveTypeOptions.find((o) => o.value === type)?.label || type;
}

function formatStatus(status: string) {
  return statusOptions.find((o) => o.value === status)?.label || status;
}

async function fetchLeaveRequests() {
  loading.value = true;
  try {
    leaveRequests.value = await getLeaveRequestsApi({
      approval_status: (searchForm.approval_status || undefined) as any,
    });
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
  <div class="leave-list-page">
    <h2>请假申请</h2>
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
      <ElButton type="primary" @click="showCreateModal = true">
        提交申请
      </ElButton>
    </ElForm>

    <ElTable :data="leaveRequests" border stripe v-loading="loading">
      <ElTableColumn prop="employee_name" label="申请人" />
      <ElTableColumn prop="leave_type" label="请假类型">
        <template #default="{ row }">
          {{ formatLeaveType(row.leave_type) }}
        </template>
      </ElTableColumn>
      <ElTableColumn prop="start_date" label="开始日期" />
      <ElTableColumn prop="end_date" label="结束日期" />
      <ElTableColumn prop="approval_status" label="状态">
        <template #default="{ row }">
          <span class="status-tag" :class="[row.approval_status]">{{
            formatStatus(row.approval_status)
          }}</span>
        </template>
      </ElTableColumn>
      <ElTableColumn prop="created_at" label="申请时间" />
      <ElTableColumn label="操作" width="200">
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
        <ElFormItem label="请假类型">
          <ElSelect v-model="createForm.leave_type">
            <ElOption
              v-for="opt in leaveTypeOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="开始日期">
          <ElDatePicker v-model="createForm.start_date" type="date" />
        </ElFormItem>
        <ElFormItem label="结束日期">
          <ElDatePicker v-model="createForm.end_date" type="date" />
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
.leave-list-page {
  padding: 20px;
}

.search-form {
  margin-bottom: 20px;
}

.status-tag {
  padding: 4px 12px;
  font-size: 12px;
  border-radius: 4px;
}

.status-tag.pending {
  color: #d97706;
  background: #fef3c7;
}

.status-tag.approved {
  color: #16a34a;
  background: #dcfce7;
}

.status-tag.rejected {
  color: #dc2626;
  background: #fee2e2;
}

.status-tag.withdrawn {
  color: #6b7280;
  background: #f3f4f6;
}
</style>
