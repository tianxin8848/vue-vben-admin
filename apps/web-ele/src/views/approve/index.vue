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
  loading,
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
  <Page
    title="审批管理"
    description="查看待我审批的请假 / 报销申请，以及我已处理过的审批记录"
    v-loading="loading"
  >
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
          v-if="activeTab === 'pending-leave' || activeTab === 'records-leave'"
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

    <ElCard class="table-card" style="margin-top: 16px">
      <ElTabs v-model="activeTab">
        <ElTabPane label="待审批 · 请假" name="pending-leave">
          <PendingLeaveTab
            :data="leaveRequests"
            :search-form="searchForm"
            @view-detail="onViewLeaveDetail"
            @review="onReviewLeave"
            @withdraw="onWithdrawLeave"
          />
        </ElTabPane>

        <ElTabPane label="待审批 · 报销" name="pending-claim">
          <PendingClaimTab
            :data="claimApprovals"
            :search-form="searchForm"
            @view-detail="onViewClaimDetail"
            @review="onReviewClaim"
            @withdraw="onWithdrawClaim"
          />
        </ElTabPane>

        <ElTabPane label="审批记录 · 请假" name="records-leave">
          <RecordsLeaveTab
            :data="leaveApprovalRecords"
            :search-form="searchForm"
            @view-detail="onViewLeaveRecord"
          />
        </ElTabPane>

        <ElTabPane label="审批记录 · 报销" name="records-claim">
          <RecordsClaimTab
            :data="claimApprovalRecords"
            :search-form="searchForm"
            @view-detail="onViewClaimRecord"
          />
        </ElTabPane>
      </ElTabs>
    </ElCard>

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
.search-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
}
</style>
