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
  withdrawLeaveRequestApi,
} from '#/api';

const router = useRouter();
const loading = ref(false);
const leaveRequests = ref<LeaveRequestApi.LeaveRequest[]>([]);

const searchForm = reactive({
  keyword: '',
  status: '',
  leave_type: '',
  department: '',
  region: '',
});

const showDetailModal = ref(false);
const showReviewModal = ref(false);
const showWithdrawModal = ref(false);
const currentRequest = ref<LeaveRequestApi.LeaveRequest | null>(null);
const reviewForm = reactive({ reviewComment: '' });
const withdrawForm = reactive({ withdrawComment: '' });

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

const filteredRequests = computed(() => {
  let list = [...leaveRequests.value];

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

  if (searchForm.leave_type) {
    list = list.filter((e) => e.leave_type === searchForm.leave_type);
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
    leaveRequests.value = await getLeaveRequestsApi({
      approval_status: searchForm.status
        ? (searchForm.status as LeaveRequestApi.ApprovalStatus)
        : null,
      employee_keyword: searchForm.keyword || undefined,
      region: searchForm.region || undefined,
      team: searchForm.department || undefined,
    });
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
  searchForm.leave_type = '';
  searchForm.department = '';
  searchForm.region = '';
  fetchLeaveRequests();
}

function openDetailModal(request: LeaveRequestApi.LeaveRequest) {
  currentRequest.value = request;
  showDetailModal.value = true;
}

function openReviewModal(request: LeaveRequestApi.LeaveRequest) {
  currentRequest.value = request;
  reviewForm.reviewComment = '';
  showReviewModal.value = true;
}

function openWithdrawModal(request: LeaveRequestApi.LeaveRequest) {
  currentRequest.value = request;
  withdrawForm.withdrawComment = '';
  showWithdrawModal.value = true;
}

async function handleReview(action: 'approved' | 'rejected') {
  if (!currentRequest.value) return;
  if (action === 'rejected' && !reviewForm.reviewComment.trim()) {
    ElMessage.warning('驳回必须填写原因');
    return;
  }
  try {
    await reviewLeaveRequestApi(currentRequest.value.id, {
      approval_status: action,
      review_comment: reviewForm.reviewComment.trim() || null,
    });
    ElMessage.success(action === 'approved' ? '已通过' : '已驳回');
    showReviewModal.value = false;
    fetchLeaveRequests();
  } catch {
    ElMessage.error('操作失败');
  }
}

async function handleWithdraw() {
  if (!currentRequest.value) return;
  try {
    await withdrawLeaveRequestApi(currentRequest.value.id, {
      withdraw_comment: withdrawForm.withdrawComment.trim() || null,
    });
    ElMessage.success('已撤回');
    showWithdrawModal.value = false;
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
  <Page
    title="请假管理"
    description="管理所有员工的请假申请，支持审批和撤回操作"
  >
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
          <ElOption label="待审批" value="pending" />
          <ElOption label="已通过" value="approved" />
          <ElOption label="已驳回" value="rejected" />
          <ElOption label="已撤回" value="withdrawn" />
        </ElSelect>
        <ElSelect
          v-model="searchForm.leave_type"
          placeholder="全部类型"
          style="width: 120px"
        >
          <ElOption label="全部类型" value="" />
          <ElOption label="年假" value="annual" />
          <ElOption label="事假" value="personal" />
          <ElOption label="病假" value="sick" />
          <ElOption label="调休" value="lieu" />
          <ElOption label="长假" value="long" />
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

    <ElCard class="table-card" header="请假列表">
      <ElTable
        :data="filteredRequests"
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
        <ElTableColumn label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <ElButton
              size="small"
              @click="openDetailModal(row as LeaveRequestApi.LeaveRequest)"
              >
详情
</ElButton>
            <ElButton
              v-if="
                (row as LeaveRequestApi.LeaveRequest).approval_status ===
                'pending'
              "
              size="small"
              type="primary"
              @click="openReviewModal(row as LeaveRequestApi.LeaveRequest)"
            >
              审批
            </ElButton>
            <ElButton
              v-if="
                (row as LeaveRequestApi.LeaveRequest).approval_status ===
                  'pending' ||
                (row as LeaveRequestApi.LeaveRequest).approval_status ===
                  'approved'
              "
              size="small"
              type="danger"
              @click="openWithdrawModal(row as LeaveRequestApi.LeaveRequest)"
            >
              撤回
            </ElButton>
          </template>
        </ElTableColumn>
      </ElTable>
    </ElCard>

    <ElDialog v-model="showDetailModal" title="请假详情" width="600px">
      <div v-if="currentRequest" style="padding: 10px 0">
        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">申请人：</span>
            <strong>{{ currentRequest.employee_name }}</strong>（{{ currentRequest.employee_username }}）
          </div>
          <div class="info-item">
            <span class="info-label">工号：</span>
            {{ currentRequest.employee_code || '-' }}
          </div>
          <div class="info-item">
            <span class="info-label">部门/地区：</span>
            {{ currentRequest.employee_department || '-' }} /
            {{ currentRequest.employee_region || '-' }}
          </div>
          <div class="info-item">
            <span class="info-label">请假类型：</span>
            {{
              leaveTypeLabelMap[currentRequest.leave_type] ||
              currentRequest.leave_type
            }}
          </div>
          <div class="info-item">
            <span class="info-label">时段：</span>
            {{
              sessionLabelMap[currentRequest.session] || currentRequest.session
            }}
          </div>
          <div class="info-item">
            <span class="info-label">时间范围：</span>
            {{ currentRequest.start_date }} ~ {{ currentRequest.end_date }}
          </div>
          <div class="info-item">
            <span class="info-label">原因：</span>
            {{ currentRequest.reason || '无' }}
          </div>
          <div class="info-item">
            <span class="info-label">交接人：</span>
            {{ currentRequest.handover_to || '无' }}
          </div>
          <div class="info-item">
            <span class="info-label">状态：</span>
            <ElTag
              :type="statusTypeMap[currentRequest.approval_status] || 'info'"
            >
              {{
                statusLabelMap[currentRequest.approval_status] ||
                currentRequest.approval_status
              }}
            </ElTag>
          </div>
          <div class="info-item">
            <span class="info-label">审批意见：</span>
            {{ currentRequest.review_comment || '无' }}
          </div>
        </div>
      </div>
      <template #footer>
        <ElButton @click="showDetailModal = false">关闭</ElButton>
      </template>
    </ElDialog>

    <ElDialog v-model="showReviewModal" title="审批请假" width="500px">
      <div v-if="currentRequest" style="padding: 10px 0">
        <p>
          申请人：{{ currentRequest.employee_name }}（{{
            currentRequest.employee_username
          }}）
        </p>
        <p>
          请假类型：{{ leaveTypeLabelMap[currentRequest.leave_type] }} |
          {{ sessionLabelMap[currentRequest.session] }}
        </p>
        <p>
          时间：{{ currentRequest.start_date }} ~ {{ currentRequest.end_date }}
        </p>
        <ElForm :model="reviewForm" label-width="80px" style="margin-top: 16px">
          <ElFormItem label="审批备注">
            <ElInput
              v-model="reviewForm.reviewComment"
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

    <ElDialog v-model="showWithdrawModal" title="撤回请假" width="500px">
      <div v-if="currentRequest" style="padding: 10px 0">
        <p>
          申请人：{{ currentRequest.employee_name }}（{{
            currentRequest.employee_username
          }}）
        </p>
        <p>
          请假类型：{{ leaveTypeLabelMap[currentRequest.leave_type] }} |
          {{ sessionLabelMap[currentRequest.session] }}
        </p>
        <p>
          时间：{{ currentRequest.start_date }} ~ {{ currentRequest.end_date }}
        </p>
        <ElForm
          :model="withdrawForm"
          label-width="80px"
          style="margin-top: 16px"
        >
          <ElFormItem label="撤回原因">
            <ElInput
              v-model="withdrawForm.withdrawComment"
              type="textarea"
              :rows="4"
              placeholder="请输入撤回原因"
            />
          </ElFormItem>
        </ElForm>
      </div>
      <template #footer>
        <ElButton @click="showWithdrawModal = false">取消</ElButton>
        <ElButton type="danger" @click="handleWithdraw">确认撤回</ElButton>
      </template>
    </ElDialog>
  </Page>
</template>
