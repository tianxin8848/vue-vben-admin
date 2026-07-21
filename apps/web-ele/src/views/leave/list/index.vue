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
  ElPagination,
  ElSelect,
  ElTable,
  ElTableColumn,
} from 'element-plus';

import {
  createLeaveRequestApi,
  deleteLeaveRequestApi,
  getLeaveRequestsApi,
} from '#/api';

const router = useRouter();
const loading = ref(false);
const leaveRequests = ref<LeaveRequestApi.LeaveRequest[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(10);

const searchForm = reactive({
  status: '',
  startDate: '',
  endDate: '',
});

const showCreateModal = ref(false);
const createForm = reactive<LeaveRequestApi.CreateLeaveRequestParams>({
  type: 'annual',
  startDate: '',
  endDate: '',
  reason: '',
});

const leaveTypeOptions = [
  { label: '病假', value: 'sick' },
  { label: '年假', value: 'annual' },
  { label: '事假', value: 'personal' },
  { label: '产假', value: 'maternity' },
  { label: '陪产假', value: 'paternity' },
  { label: '其他', value: 'other' },
];

const statusOptions = [
  { label: '待审批', value: 'pending' },
  { label: '已批准', value: 'approved' },
  { label: '已拒绝', value: 'rejected' },
  { label: '已撤销', value: 'cancelled' },
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
    const res = await getLeaveRequestsApi({
      page: page.value,
      pageSize: pageSize.value,
      ...searchForm,
    });
    leaveRequests.value = res.data;
    total.value = res.total;
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  page.value = 1;
  fetchLeaveRequests();
}

function handleReset() {
  searchForm.status = '';
  searchForm.startDate = '';
  searchForm.endDate = '';
  fetchLeaveRequests();
}

function handlePageChange(val: number) {
  page.value = val;
  fetchLeaveRequests();
}

function handlePageSizeChange(val: number) {
  pageSize.value = val;
  page.value = 1;
  fetchLeaveRequests();
}

function viewDetail(id: string) {
  router.push(`/leave/detail/${id}`);
}

async function handleDelete(id: string) {
  try {
    await deleteLeaveRequestApi(id);
    ElMessage.success('撤销成功');
    fetchLeaveRequests();
  } catch {
    ElMessage.error('撤销失败');
  }
}

async function handleCreate() {
  if (!createForm.startDate || !createForm.endDate) {
    ElMessage.warning('请选择日期');
    return;
  }
  try {
    await createLeaveRequestApi(createForm);
    ElMessage.success('提交成功');
    showCreateModal.value = false;
    createForm.type = 'annual';
    createForm.startDate = '';
    createForm.endDate = '';
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
        <ElSelect v-model="searchForm.status" placeholder="请选择" clearable>
          <ElOption
            v-for="opt in statusOptions"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </ElSelect>
      </ElFormItem>
      <ElFormItem label="开始日期">
        <ElDatePicker
          v-model="searchForm.startDate"
          type="date"
          placeholder="选择日期"
        />
      </ElFormItem>
      <ElFormItem label="结束日期">
        <ElDatePicker
          v-model="searchForm.endDate"
          type="date"
          placeholder="选择日期"
        />
      </ElFormItem>
      <ElButton type="primary" @click="handleSearch">搜索</ElButton>
      <ElButton @click="handleReset">重置</ElButton>
      <ElButton type="primary" @click="showCreateModal = true">
        提交申请
      </ElButton>
    </ElForm>

    <ElTable :data="leaveRequests" border stripe v-loading="loading">
      <ElTableColumn prop="employeeName" label="申请人" />
      <ElTableColumn prop="type" label="请假类型">
        <template #default="{ row }">{{ formatLeaveType(row.type) }}</template>
      </ElTableColumn>
      <ElTableColumn prop="startDate" label="开始日期" />
      <ElTableColumn prop="endDate" label="结束日期" />
      <ElTableColumn prop="duration" label="天数" />
      <ElTableColumn prop="status" label="状态">
        <template #default="{ row }">
          <span class="status-tag" :class="[row.status]">{{
            formatStatus(row.status)
          }}</span>
        </template>
      </ElTableColumn>
      <ElTableColumn prop="createdAt" label="申请时间" />
      <ElTableColumn label="操作" width="200">
        <template #default="{ row }">
          <ElButton size="small" @click="viewDetail(row.id)">详情</ElButton>
          <ElButton
            v-if="row.status === 'pending'"
            size="small"
            type="danger"
            @click="handleDelete(row.id)"
          >
            撤销
          </ElButton>
        </template>
      </ElTableColumn>
    </ElTable>

    <ElPagination
      :current-page="page"
      :page-size="pageSize"
      :total="total"
      layout="total, sizes, prev, pager, next, jumper"
      @size-change="handlePageSizeChange"
      @current-change="handlePageChange"
      class="pagination"
    />

    <ElDialog v-model="showCreateModal" title="提交请假申请" width="500px">
      <ElForm :model="createForm" label-width="100px">
        <ElFormItem label="请假类型">
          <ElSelect v-model="createForm.type">
            <ElOption
              v-for="opt in leaveTypeOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="开始日期">
          <ElDatePicker v-model="createForm.startDate" type="date" />
        </ElFormItem>
        <ElFormItem label="结束日期">
          <ElDatePicker v-model="createForm.endDate" type="date" />
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

.pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
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

.status-tag.cancelled {
  color: #6b7280;
  background: #f3f4f6;
}
</style>
