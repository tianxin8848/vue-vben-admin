<script lang="ts" setup>
import type { LeaveRequestApi } from '#/api';

import { computed, onMounted, reactive, ref } from 'vue';

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
  ElTabPane,
  ElTabs,
  ElTag,
} from 'element-plus';

import {
  getMyApprovalRecordsApi,
  getMyPendingApprovalsApi,
  getSystemSettingsApi,
  reviewLeaveRequestApi,
  withdrawLeaveRequestApi,
} from '#/api';

const loading = ref(false);
const activeTab = ref<'pending' | 'records'>('pending');

const leaveRequests = ref<LeaveRequestApi.LeaveRequest[]>([]);
const approvalRecords = ref<LeaveRequestApi.ApprovalRecord[]>([]);

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
const currentRequestId = ref('');
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

const actionLabelMap: Record<string, string> = {
  approved: '已通过',
  rejected: '已驳回',
  submitted: '已提交',
  withdrawn: '已撤回',
};

const statusTypeMap: Record<string, 'danger' | 'info' | 'success' | 'warning'> =
  {
    pending: 'warning',
    approved: 'success',
    rejected: 'danger',
    withdrawn: 'info',
  };

const actionTypeMap: Record<string, 'danger' | 'info' | 'success' | 'warning'> =
  {
    approved: 'success',
    rejected: 'danger',
    submitted: 'warning',
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

/**
 * 从后端加载待我审批的请假列表 + 我的审批记录
 *
 * 与后端 approval_management.html 页保持一致：
 * - 待审批：GET /leave-requests/approvals/my （只需登录，无需 leave_calendar 权限）
 * - 审批记录：GET /leave-requests/approvals/records/my （只需登录）
 * 原错误调用 GET /leave-requests 会要求 leave_calendar module 权限，
 * 导致仅拥有 approval_management 权限的用户拿到 403。
 */
async function fetchApprovalData() {
  loading.value = true;
  try {
    const [pending, records] = await Promise.all([
      getMyPendingApprovalsApi().catch(() => []),
      getMyApprovalRecordsApi().catch(() => []),
    ]);
    leaveRequests.value = pending;
    approvalRecords.value = records;
  } finally {
    loading.value = false;
  }
}

/**
 * 匹配一条待审批记录是否通过关键字/筛选条件
 */
function matchPendingRequest(
  row: LeaveRequestApi.LeaveRequest,
  kw: string,
): boolean {
  if (searchForm.status && row.approval_status !== searchForm.status)
    return false;
  if (searchForm.leave_type && row.leave_type !== searchForm.leave_type)
    return false;
  if (
    searchForm.department &&
    row.employee_department !== searchForm.department
  )
    return false;
  if (searchForm.region && row.employee_region !== searchForm.region)
    return false;
  if (!kw) return true;
  const hay = [
    row.employee_name,
    row.employee_username,
    row.employee_code,
    row.employee_department,
    row.employee_region,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return hay.includes(kw);
}

/**
 * 匹配一条审批记录是否通过筛选条件
 */
function matchApprovalRecord(
  row: LeaveRequestApi.ApprovalRecord,
  kw: string,
): boolean {
  if (searchForm.status && row.approval_status_after !== searchForm.status)
    return false;
  if (searchForm.leave_type && row.leave_type !== searchForm.leave_type)
    return false;
  if (
    searchForm.department &&
    row.employee_department !== searchForm.department
  )
    return false;
  if (searchForm.region && row.employee_region !== searchForm.region)
    return false;
  if (!kw) return true;
  const hay = [
    row.employee_name,
    row.employee_username,
    row.employee_code,
    row.employee_department,
    row.employee_region,
    row.comment,
    row.operator_name,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return hay.includes(kw);
}

const filteredPending = computed(() => {
  const kw = searchForm.keyword.trim().toLowerCase();
  return leaveRequests.value.filter((r) => matchPendingRequest(r, kw));
});

const filteredRecords = computed(() => {
  const kw = searchForm.keyword.trim().toLowerCase();
  return approvalRecords.value.filter((r) => matchApprovalRecord(r, kw));
});

function handleSearch() {
  // 数据全部走客户端筛选，只触发表格重算
}

function handleReset() {
  searchForm.keyword = '';
  searchForm.status = '';
  searchForm.leave_type = '';
  searchForm.department = '';
  searchForm.region = '';
}

function openDetailModal(request: LeaveRequestApi.LeaveRequest) {
  currentRequest.value = request;
  showDetailModal.value = true;
}

function openDetailFromRecord(record: LeaveRequestApi.ApprovalRecord) {
  currentRequest.value = {
    id: record.leave_request_id,
    employee_id: record.employee_id,
    employee_user_id: null as unknown as number,
    employee_name: record.employee_name,
    employee_username: record.employee_username,
    employee_code: record.employee_code,
    employee_department: record.employee_department,
    employee_region: record.employee_region,
    leave_type: record.leave_type,
    session: record.session,
    start_date: record.start_date,
    end_date: record.end_date,
    approval_status: record.approval_status_after,
    handover_to: null,
    reason: null,
    review_comment: record.comment,
    reviewer_id: record.operator_id,
    reviewer_name: record.operator_name,
    reviewed_at: record.created_at,
    current_approver_id: null,
    approval_chain: [],
    approval_history: [],
    date_keys: [],
    created_at: record.created_at,
    created_by_id: record.employee_id,
    created_by_name: record.employee_name,
    updated_at: null,
  } as unknown as LeaveRequestApi.LeaveRequest;
  showDetailModal.value = true;
}

function openReviewModal(request: LeaveRequestApi.LeaveRequest) {
  currentRequestId.value = request.id;
  currentRequest.value = request;
  reviewForm.reviewComment = '';
  showReviewModal.value = true;
}

function openWithdrawModal(request: LeaveRequestApi.LeaveRequest) {
  currentRequestId.value = request.id;
  currentRequest.value = request;
  withdrawForm.withdrawComment = '';
  showWithdrawModal.value = true;
}

async function handleReview(action: 'approved' | 'rejected') {
  if (!currentRequestId.value) return;
  if (action === 'rejected' && !reviewForm.reviewComment.trim()) {
    ElMessage.warning('驳回必须填写原因');
    return;
  }
  try {
    await reviewLeaveRequestApi(currentRequestId.value, {
      approval_status: action,
      review_comment: reviewForm.reviewComment.trim() || null,
    });
    ElMessage.success(action === 'approved' ? '已通过' : '已驳回');
    showReviewModal.value = false;
    await fetchApprovalData();
  } catch {
    ElMessage.error('操作失败');
  }
}

async function handleWithdraw() {
  if (!currentRequestId.value) return;
  try {
    await withdrawLeaveRequestApi(currentRequestId.value, {
      withdraw_comment: withdrawForm.withdrawComment.trim() || null,
    });
    ElMessage.success('已撤回');
    showWithdrawModal.value = false;
    await fetchApprovalData();
  } catch {
    ElMessage.error('撤回失败（需本人或拥有请假模块权限）');
  }
}

onMounted(async () => {
  await fetchSystemSettings();
  await fetchApprovalData();
});
</script>

<template>
  <Page
    title="审批管理"
    description="查看待我审批的请假申请，以及我已处理过的审批记录"
    v-loading="loading"
  >
    <ElCard class="search-card">
      <div class="search-bar">
        <ElInput
          v-model="searchForm.keyword"
          placeholder="搜索员工姓名 / 账号 / 工号 / 备注"
          style="width: 280px"
          clearable
          @keyup.enter="handleSearch"
        />
        <ElSelect
          v-model="searchForm.status"
          placeholder="全部状态"
          style="width: 120px"
          clearable
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
          clearable
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
        <ElButton @click="fetchApprovalData">刷新列表</ElButton>
      </div>
    </ElCard>

    <ElCard class="table-card" style="margin-top: 16px">
      <ElTabs v-model="activeTab">
        <ElTabPane label="待审批" name="pending">
          <p class="tab-summary">
            共 {{ leaveRequests.length }} 条待审批，当前筛选
            {{ filteredPending.length }} 条
          </p>
          <ElTable
            :data="filteredPending"
            border
            stripe
            size="small"
            empty-text="暂无待审批请假"
          >
            <ElTableColumn prop="employee_name" label="申请人" width="100" />
            <ElTableColumn prop="employee_username" label="账号" width="120" />
            <ElTableColumn prop="employee_code" label="工号" width="100" />
            <ElTableColumn
              prop="employee_department"
              label="部门"
              width="140"
            />
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
                  {{
                    statusLabelMap[row.approval_status] || row.approval_status
                  }}
                </ElTag>
              </template>
            </ElTableColumn>
            <ElTableColumn label="操作" width="200" fixed="right">
              <template #default="{ row }">
                <ElButton
                  size="small"
                  @click="openDetailModal(row as LeaveRequestApi.LeaveRequest)"
                >
                  详情
                </ElButton>
                <ElButton
                  v-if="row.approval_status === 'pending'"
                  size="small"
                  type="primary"
                  @click="openReviewModal(row as LeaveRequestApi.LeaveRequest)"
                >
                  审批
                </ElButton>
                <ElButton
                  v-if="
                    row.approval_status === 'pending' ||
                    row.approval_status === 'approved'
                  "
                  size="small"
                  type="danger"
                  @click="
                    openWithdrawModal(row as LeaveRequestApi.LeaveRequest)
                  "
                >
                  撤回
                </ElButton>
              </template>
            </ElTableColumn>
          </ElTable>
        </ElTabPane>

        <ElTabPane label="审批记录" name="records">
          <p class="tab-summary">
            共 {{ approvalRecords.length }} 条记录，当前筛选
            {{ filteredRecords.length }} 条
          </p>
          <ElTable
            :data="filteredRecords"
            border
            stripe
            size="small"
            empty-text="暂无审批记录"
          >
            <ElTableColumn prop="employee_name" label="申请人" width="100" />
            <ElTableColumn prop="employee_username" label="账号" width="120" />
            <ElTableColumn prop="employee_code" label="工号" width="100" />
            <ElTableColumn
              prop="employee_department"
              label="部门"
              width="140"
            />
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
            <ElTableColumn label="我的操作" width="100">
              <template #default="{ row }">
                <ElTag :type="actionTypeMap[row.action] || 'info'">
                  {{ actionLabelMap[row.action] || row.action }}
                </ElTag>
              </template>
            </ElTableColumn>
            <ElTableColumn label="当前状态" width="100">
              <template #default="{ row }">
                <ElTag
                  :type="statusTypeMap[row.approval_status_after] || 'info'"
                >
                  {{
                    statusLabelMap[row.approval_status_after] ||
                    row.approval_status_after
                  }}
                </ElTag>
              </template>
            </ElTableColumn>
            <ElTableColumn
              prop="comment"
              label="审批备注"
              min-width="150"
              show-overflow-tooltip
            />
            <ElTableColumn prop="created_at" label="处理时间" width="170">
              <template #default="{ row }">
                {{
                  row.created_at
                    ? new Date(row.created_at).toLocaleString('zh-CN')
                    : '-'
                }}
              </template>
            </ElTableColumn>
            <ElTableColumn label="操作" width="100" fixed="right">
              <template #default="{ row }">
                <ElButton
                  size="small"
                  @click="
                    openDetailFromRecord(row as LeaveRequestApi.ApprovalRecord)
                  "
                >
                  详情
                </ElButton>
              </template>
            </ElTableColumn>
          </ElTable>
        </ElTabPane>
      </ElTabs>
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
          时间：{{ currentRequest.start_date }} ~
          {{ currentRequest.end_date }}
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
          时间：{{ currentRequest.start_date }} ~
          {{ currentRequest.end_date }}
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

<style scoped>
.search-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
}

.tab-summary {
  margin: 0 0 12px;
  font-size: 14px;
  color: #64748b;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px 20px;
}

.info-item {
  font-size: 14px;
  line-height: 1.6;
}

.info-label {
  color: #64748b;
}
</style>
