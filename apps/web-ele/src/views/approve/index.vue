<script lang="ts" setup>
import type { SearchForm } from './constants';

import type { ClaimApi, LeaveRequestApi } from '#/api';

import { onMounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  ElButton,
  ElCard,
  ElInput,
  ElOption,
  ElSelect,
  ElTabPane,
  ElTabs,
} from 'element-plus';

import { getLeaveApprovalsMetaApi } from '#/api';

import ClaimDetailDialog from './components/ClaimDetailDialog.vue';
import ClaimReviewDialog from './components/ClaimReviewDialog.vue';
import ClaimWithdrawDialog from './components/ClaimWithdrawDialog.vue';
import LeaveDetailDialog from './components/LeaveDetailDialog.vue';
import LeaveReviewDialog from './components/LeaveReviewDialog.vue';
import LeaveWithdrawDialog from './components/LeaveWithdrawDialog.vue';
import PendingClaimTab from './components/PendingClaimTab.vue';
import PendingLeaveTab from './components/PendingLeaveTab.vue';
import RecordsClaimTab from './components/RecordsClaimTab.vue';
import RecordsLeaveTab from './components/RecordsLeaveTab.vue';
import { useApprovalData } from './composables/useApprovalData';
import { leaveRequestFromRecord } from './constants';

const {
  leaveRequests,
  leaveApprovalRecords,
  claimApprovals,
  claimApprovalRecords,
  fetchApprovalData,
} = useApprovalData();

const activeTab = ref<
  'pending-claim' | 'pending-leave' | 'records-claim' | 'records-leave'
>('pending-leave');

const searchForm = reactive<SearchForm>({
  keyword: '',
  status: '',
  leave_type: '',
  department: '',
  region: '',
});

const departmentOptions = ref<{ label: string; value: string }[]>([]);
const regionOptions = ref<{ label: string; value: string }[]>([]);

async function fetchSystemSettings() {
  try {
    const meta = await getLeaveApprovalsMetaApi();
    departmentOptions.value = (meta.departments || []).map((d) => ({
      label: d,
      value: d,
    }));
    regionOptions.value = (meta.regions || []).map((r) => ({
      label: r,
      value: r,
    }));
  } catch {
    // 获取系统设置失败时保持空选项
  }
}

function handleReset() {
  searchForm.keyword = '';
  searchForm.status = '';
  searchForm.leave_type = '';
  searchForm.department = '';
  searchForm.region = '';
}

// ─── 弹窗状态 ─────────────────────────────────────────────────────────────────
const showLeaveDetailDialog = ref(false);
const showLeaveReviewDialog = ref(false);
const showLeaveWithdrawDialog = ref(false);
const showClaimDetailDialog = ref(false);
const showClaimReviewDialog = ref(false);
const showClaimWithdrawDialog = ref(false);

const currentLeave = ref<LeaveRequestApi.LeaveRequest | null>(null);
const currentClaim = ref<ClaimApi.ClaimResponse | null>(null);

// ─── Tab 事件 → 打开弹窗 ─────────────────────────────────────────────────────
function onViewLeaveDetail(row: LeaveRequestApi.LeaveRequest) {
  currentLeave.value = row;
  showLeaveDetailDialog.value = true;
}

function onViewLeaveRecord(row: LeaveRequestApi.ApprovalRecord) {
  currentLeave.value = leaveRequestFromRecord(row);
  showLeaveDetailDialog.value = true;
}

function onReviewLeave(row: LeaveRequestApi.LeaveRequest) {
  currentLeave.value = row;
  showLeaveReviewDialog.value = true;
}

function onWithdrawLeave(row: LeaveRequestApi.LeaveRequest) {
  currentLeave.value = row;
  showLeaveWithdrawDialog.value = true;
}

function onViewClaimDetail(row: ClaimApi.ClaimResponse) {
  currentClaim.value = row;
  showClaimDetailDialog.value = true;
}

function onViewClaimRecord(row: ClaimApi.ClaimApprovalRecord) {
  currentClaim.value = {
    id: row.claim_request_id,
    employee_id: row.employee_id,
    employee_username: row.employee_username,
    employee_name: row.employee_name,
    employee_department: row.employee_department,
    employee_region: row.employee_region,
    reason_code: row.claim_reason_code,
    reason_label: row.claim_reason_label,
    description: null,
    amount: row.amount,
    currency: row.currency,
    exchange_rate_to_hkd: null,
    amount_hkd: row.amount_hkd,
    approval_status: row.approval_status_after,
    approval_chain: [],
    current_approver_id: row.current_approver_id_after,
    approval_history: [],
    attachment_url: null,
    attachment_name: null,
    invoice_date: null,
    invoice_no: null,
    items: [],
    created_by_id: row.employee_id,
    created_by_name: row.employee_name,
    review_comment: row.comment,
    reviewed_at: row.created_at,
    created_at: row.created_at,
    updated_at: null,
  } as unknown as ClaimApi.ClaimResponse;
  showClaimDetailDialog.value = true;
}

function onReviewClaim(row: ClaimApi.ClaimResponse) {
  currentClaim.value = row;
  showClaimReviewDialog.value = true;
}

function onWithdrawClaim(row: ClaimApi.ClaimResponse) {
  currentClaim.value = row;
  showClaimWithdrawDialog.value = true;
}

onMounted(async () => {
  await fetchSystemSettings();
  await fetchApprovalData();
});
</script>

<template>
  <Page>
    <div class="approve-layout h-full">
      <ElCard class="search-card">
        <div class="search-bar">
          <ElInput
            v-model="searchForm.keyword"
            placeholder="搜索员工姓名 / 账号 / 工号 / 备注 / 理由"
            style="width: 280px"
            clearable
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
            v-if="
              activeTab === 'pending-leave' || activeTab === 'records-leave'
            "
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
          <ElButton @click="handleReset">重置筛选</ElButton>
          <ElButton @click="fetchApprovalData">刷新列表</ElButton>
        </div>
      </ElCard>

      <ElCard class="table-card">
        <ElTabs
          v-model="activeTab"
          class="approve-tabs"
          :tab-transition="false"
          :tab-pane-transition="false"
        >
          <ElTabPane label="待审批 · 请假" name="pending-leave">
            <div class="tab-pane-wrapper">
              <PendingLeaveTab
                :data="leaveRequests"
                :search-form="searchForm"
                @view-detail="onViewLeaveDetail"
                @review="onReviewLeave"
                @withdraw="onWithdrawLeave"
              />
            </div>
          </ElTabPane>

          <ElTabPane label="待审批 · 报销" name="pending-claim">
            <div class="tab-pane-wrapper">
              <PendingClaimTab
                :data="claimApprovals"
                :search-form="searchForm"
                @view-detail="onViewClaimDetail"
                @review="onReviewClaim"
                @withdraw="onWithdrawClaim"
              />
            </div>
          </ElTabPane>

          <ElTabPane label="审批记录 · 请假" name="records-leave">
            <div class="tab-pane-wrapper">
              <RecordsLeaveTab
                :data="leaveApprovalRecords"
                :search-form="searchForm"
                @view-detail="onViewLeaveRecord"
              />
            </div>
          </ElTabPane>

          <ElTabPane label="审批记录 · 报销" name="records-claim">
            <div class="tab-pane-wrapper">
              <RecordsClaimTab
                :data="claimApprovalRecords"
                :search-form="searchForm"
                @view-detail="onViewClaimRecord"
              />
            </div>
          </ElTabPane>
        </ElTabs>
      </ElCard>
    </div>

    <LeaveDetailDialog
      v-model="showLeaveDetailDialog"
      :current="currentLeave"
    />
    <LeaveReviewDialog
      v-model="showLeaveReviewDialog"
      :current="currentLeave"
      @confirmed="fetchApprovalData"
    />
    <LeaveWithdrawDialog
      v-model="showLeaveWithdrawDialog"
      :current="currentLeave"
      @confirmed="fetchApprovalData"
    />
    <ClaimDetailDialog
      v-model="showClaimDetailDialog"
      :current="currentClaim"
    />
    <ClaimReviewDialog
      v-model="showClaimReviewDialog"
      :current="currentClaim"
      @confirmed="fetchApprovalData"
    />
    <ClaimWithdrawDialog
      v-model="showClaimWithdrawDialog"
      :current="currentClaim"
      @confirmed="fetchApprovalData"
    />
  </Page>
</template>

<style scoped>
/* Page 提供固定高度预算 → approve-layout 通过 h-full 继承 → 高度不随内容变化 */
.approve-layout {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 0;
  overflow: hidden;
}

.search-card {
  flex-shrink: 0;
}

.search-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
}

/* table-card 占据 approve-layout 剩余高度（search-card 之后的全部空间） */
.table-card {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}

.table-card :deep(.el-card__body) {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  padding: 12px 16px 8px;
  overflow: hidden;
}

/* ElTabs 完全填充 table-card__body，高度由父链决定 → 不会因内容重排 */
.approve-tabs {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}

.approve-tabs :deep(.el-tabs__header) {
  flex-shrink: 0;
  margin: 0 0 12px;
}

.approve-tabs :deep(.el-tabs__content) {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}

.approve-tabs :deep(.el-tab-pane) {
  display: flex;
  flex: 1;
  flex-direction: column;
  height: auto;
  min-height: 0;
  overflow: hidden;
}

.tab-pane-wrapper {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}

.tab-pane-wrapper > :first-child {
  display: flex;
  flex: 1;
  flex-direction: column;
  width: 100%;
  min-height: 0;
}

/*
 * 最关键：覆盖全局 style.css#L54 的
 *   :root .vxe-grid { height: auto !important; }
 * 特异性 (1,2,1) > 全局的 (0,1,1)，让 vxe-grid 填满父容器高度
 * 而不是按内容行数撑开 → approve-layout 高度彻底固定，切换 Tab 不再抖
 */
.approve-tabs :deep(.vxe-grid) {
  flex: 1;
  height: 100% !important;
  min-height: 0;
}

.approve-tabs :deep(.h-full.rounded-md.bg-card) {
  display: flex;
  flex-direction: column;
  height: 100% !important;
  min-height: 0;
}
</style>
