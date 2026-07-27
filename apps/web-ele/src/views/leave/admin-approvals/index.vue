<script lang="ts" setup>
import type { LeaveRequestApi } from '#/api';

import { computed, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';

import {
  ElButton,
  ElCard,
  ElDialog,
  ElForm,
  ElFormItem,
  ElInput,
  ElMessage,
  ElOption,
  ElSelect,
  ElTable,
  ElTableColumn,
  ElTag,
} from 'element-plus';

import {
  getLeaveRequestsApi,
  getSystemSettingsApi,
  reviewLeaveRequestApi,
} from '#/api';

const router = useRouter();
const loading = ref(false);
const leaveRequests = ref<LeaveRequestApi.LeaveRequest[]>([]);

const searchForm = reactive({
  keyword: '',
  status: '',
  department: '',
  region: '',
});

const showReviewModal = ref(false);
const currentRequest = ref<LeaveRequestApi.LeaveRequest | null>(null);
const reviewComment = ref('');

const departmentOptions = ref<{ label: string; value: string }[]>([]);
const regionOptions = ref<{ label: string; value: string }[]>([]);

const leaveTypeLabelMap: Record<string, string> = {
  annual: '年假',
  personal: '事假',
  sick: '病假',
  lieu: '调休',
  long: '长假',
};

const sessionLabelMap: Record<string, string> = {
  full_day: '全天',
  morning: '上午',
  afternoon: '下午',
};

const statusLabelMap: Record<string, string> = {
  pending: '待审批',
  approved: '已通过',
  rejected: '已驳回',
  withdrawn: '已撤回',
};

const statusTypeMap: Record<string, 'danger' | 'info' | 'success' | 'warning'> =
  {
    pending: 'warning',
    approved: 'success',
    rejected: 'danger',
    withdrawn: 'info',
  };

async function fetchSystemSettings() {
  try {
    const settings = await getSystemSettingsApi();
    departmentOptions.value = (settings.departments || []).map((d) => ({
      label: d,
      value: d,
    }));
    regionOptions.value = (settings.regions || []).map((r) => ({
      label: r,
      value: r,
    }));
  } catch {
    // 获取系统设置失败时保持空选项
  }
}

const pendingRequests = computed(() => {
  let list = leaveRequests.value.filter((r) => r.approval_status === 'pending');

  if (searchForm.keyword) {
    const kw = searchForm.keyword.toLowerCase();
    list = list.filter(
      (e) =>
        e.employee_name.toLowerCase().includes(kw) ||
        e.employee_username.toLowerCase().includes(kw) ||
        e.employee_code?.toLowerCase().includes(kw),
    );
  }

  if (searchForm.department) {
    list = list.filter((e) => e.employee_department === searchForm.department);
  }

  if (searchForm.region) {
    list = list.filter((e) => e.employee_region === searchForm.region);
  }

  return list;
});

const processedRequests = computed(() => {
  let list = leaveRequests.value.filter((r) => r.approval_status !== 'pending');

  if (searchForm.keyword) {
    const kw = searchForm.keyword.toLowerCase();
    list = list.filter(
      (e) =>
        e.employee_name.toLowerCase().includes(kw) ||
        e.employee_username.toLowerCase().includes(kw) ||
        e.employee_code?.toLowerCase().includes(kw),
    );
  }

  if (searchForm.status) {
    list = list.filter((e) => e.approval_status === searchForm.status);
  }

  if (searchForm.department) {
    list = list.filter((e) => e.employee_department === searchForm.department);
  }

  if (searchForm.region) {
    list = list.filter((e) => e.employee_region === searchForm.region);
  }

  return list;
});

async function fetchLeaveRequests() {
  loading.value = true;
  try {
    leaveRequests.value = await getLeaveRequestsApi();
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  fetchLeaveRequests();
}

function handleReset() {
  searchForm.keyword = '';
  searchForm.status = '';
  searchForm.department = '';
  searchForm.region = '';
  fetchLeaveRequests();
}

function openReviewModal(request: LeaveRequestApi.LeaveRequest) {
  currentRequest.value = request;
  reviewComment.value = '';
  showReviewModal.value = true;
}

async function handleReview(action: 'approved' | 'rejected') {
  if (!currentRequest.value) return;
  if (action === 'rejected' && !reviewComment.value.trim()) {
    ElMessage.warning('驳回必须填写原因');
    return;
  }
  try {
    await reviewLeaveRequestApi(currentRequest.value.id, {
      approval_status: action,
      review_comment: reviewComment.value.trim() || null,
    });
    ElMessage.success(action === 'approved' ? '已通过' : '已驳回');
    showReviewModal.value = false;
    fetchLeaveRequests();
  } catch {
    ElMessage.error('操作失败');
  }
}

function goBack() {
  router.push('/employee/manage/users');
}

fetchSystemSettings();
fetchLeaveRequests();
</script>

<template>
  <Page title="审批管理" description="管理所有员工的请假审批，支持审批操作">
    <ElButton @click="goBack" style="margin-bottom: 16px">返回</ElButton>

    <ElCard class="search-card">
      <div class="search-bar">
        <ElInput
          v-model="searchForm.keyword"
          placeholder="搜索员工姓名 / 账号 / 工号"
          style="width: 250px"
          clearable
          @keyup.enter="handleSearch"
        />
        <ElSelect
          v-model="searchForm.status"
          placeholder="全部状态"
          style="width: 120px"
        >
          <ElOption label="全部状态" value="" />
          <ElOption label="已通过" value="approved" />
          <ElOption label="已驳回" value="rejected" />
          <ElOption label="已撤回" value="withdrawn" />
        </ElSelect>
        <ElSelect
          v-model="searchForm.department"
          placeholder="全部部门"
          style="width: 140px"
          clearable
        >
          <ElOption label="全部部门" value="" />
          <ElOption
            v-for="opt in departmentOptions"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </ElSelect>
        <ElSelect
          v-model="searchForm.region"
          placeholder="全部地区"
          style="width: 120px"
          clearable
        >
          <ElOption label="全部地区" value="" />
          <ElOption
            v-for="opt in regionOptions"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </ElSelect>
        <ElButton type="primary" @click="handleSearch">搜索</ElButton>
        <ElButton @click="handleReset">重置筛选</ElButton>
        <ElButton @click="fetchLeaveRequests">刷新列表</ElButton>
      </div>
    </ElCard>

    <ElCard class="table-card" header="待审批列表">
      <div style="margin-bottom: 12px; color: #64748b">
        待办 {{ pendingRequests.length }} 条
      </div>
      <ElTable
        :data="pendingRequests"
        border
        stripe
        v-loading="loading"
        size="small"
      >
        <ElTableColumn prop="employee_name" label="申请人" width="100" />
        <ElTableColumn prop="employee_username" label="账号" width="120" />
        <ElTableColumn prop="employee_code" label="工号" width="100" />
        <ElTableColumn prop="employee_department" label="部门" width="140" />
        <ElTableColumn prop="employee_region" label="地区" width="100" />
        <ElTableColumn prop="leave_type" label="类型" width="80">
          <template #default="{ row }">
            {{ leaveTypeLabelMap[row.leave_type] || row.leave_type }}
          </template>
        </ElTableColumn>
        <ElTableColumn prop="session" label="时段" width="80">
          <template #default="{ row }">
            {{ sessionLabelMap[row.session] || row.session }}
          </template>
        </ElTableColumn>
        <ElTableColumn label="时间范围" min-width="180">
          <template #default="{ row }">
            {{ row.start_date }} ~ {{ row.end_date }}
          </template>
        </ElTableColumn>
        <ElTableColumn
          prop="reason"
          label="原因"
          min-width="150"
          show-overflow-tooltip
        />
        <ElTableColumn label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <ElButton size="small" type="primary" @click="openReviewModal(row)">
审批
</ElButton>
          </template>
        </ElTableColumn>
      </ElTable>
      <div
        v-if="pendingRequests.length === 0"
        style="padding: 40px; color: #64748b; text-align: center"
      >
        暂无待审批请假
      </div>
    </ElCard>

    <ElCard class="table-card" header="已处理记录" style="margin-top: 20px">
      <div style="margin-bottom: 12px; color: #64748b">
        已处理 {{ processedRequests.length }} 条
      </div>
      <ElTable :data="processedRequests" border stripe size="small">
        <ElTableColumn prop="employee_name" label="申请人" width="100" />
        <ElTableColumn prop="employee_username" label="账号" width="120" />
        <ElTableColumn prop="employee_code" label="工号" width="100" />
        <ElTableColumn prop="employee_department" label="部门" width="140" />
        <ElTableColumn prop="employee_region" label="地区" width="100" />
        <ElTableColumn prop="leave_type" label="类型" width="80">
          <template #default="{ row }">
            {{ leaveTypeLabelMap[row.leave_type] || row.leave_type }}
          </template>
        </ElTableColumn>
        <ElTableColumn label="时间范围" min-width="180">
          <template #default="{ row }">
            {{ row.start_date }} ~ {{ row.end_date }}
          </template>
        </ElTableColumn>
        <ElTableColumn prop="approval_status" label="状态" width="100">
          <template #default="{ row }">
            <ElTag :type="statusTypeMap[row.approval_status] || 'info'">
              {{ statusLabelMap[row.approval_status] || row.approval_status }}
            </ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn
          prop="review_comment"
          label="审批意见"
          min-width="150"
          show-overflow-tooltip
        />
        <ElTableColumn prop="reviewed_at" label="处理时间" width="160">
          <template #default="{ row }">
            {{
              row.reviewed_at
                ? new Date(row.reviewed_at).toLocaleString('zh-CN')
                : '-'
            }}
          </template>
        </ElTableColumn>
      </ElTable>
      <div
        v-if="processedRequests.length === 0"
        style="padding: 40px; color: #64748b; text-align: center"
      >
        暂无已处理记录
      </div>
    </ElCard>

    <ElDialog v-model="showReviewModal" title="审批请假" width="500px">
      <div v-if="currentRequest" style="padding: 10px 0">
        <p>
          申请人：{{ currentRequest.employee_name }}（{{
            currentRequest.employee_username
          }}）
        </p>
        <p>工号：{{ currentRequest.employee_code || '-' }}</p>
        <p>
          部门/地区：{{ currentRequest.employee_department || '-' }} /
          {{ currentRequest.employee_region || '-' }}
        </p>
        <p>
          请假类型：{{ leaveTypeLabelMap[currentRequest.leave_type] }} |
          {{ sessionLabelMap[currentRequest.session] }}
        </p>
        <p>
          时间：{{ currentRequest.start_date }} ~ {{ currentRequest.end_date }}
        </p>
        <p>原因：{{ currentRequest.reason || '无' }}</p>
        <ElForm
          :model="reviewComment"
          label-width="80px"
          style="margin-top: 16px"
        >
          <ElFormItem label="审批备注">
            <ElInput
              v-model="reviewComment"
              type="textarea"
              :rows="4"
              placeholder="通过可不填；驳回必须填写原因"
            />
          </ElFormItem>
        </ElForm>
      </div>
      <template #footer>
        <ElButton @click="showReviewModal = false">取消</ElButton>
        <ElButton type="danger" @click="handleReview('rejected')">
驳回
</ElButton>
        <ElButton type="primary" @click="handleReview('approved')">
通过
</ElButton>
      </template>
    </ElDialog>
  </Page>
</template>
