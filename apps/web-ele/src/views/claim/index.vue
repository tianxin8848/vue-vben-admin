<script lang="ts" setup>
import type { VxeGridProps } from '#/adapter/vxe-table';
import type { ClaimApi } from '#/api';

import { computed, onMounted, ref, watch } from 'vue';

import { Page } from '@vben/common-ui';
import { useI18n } from '@vben/locales';

import { ElButton, ElSegmented, ElTag } from 'element-plus';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  getClaimOptionsApi,
  getMyClaimApprovalRecordsApi,
  getMyClaimHistoryApi,
  getMyClaimsApi,
  getMyPendingClaimApprovalsApi,
  getUserInfoApi,
} from '#/api';

import CreateClaimDrawer from './components/CreateClaimDrawer.vue';
import ReviewClaimDrawer from './components/ReviewClaimDrawer.vue';

const { t } = useI18n();

const loading = ref(false);

const userInfo = ref<null | {
  full_name: string;
  username: string;
}>(null);

// ─── 选项数据 ────────────────────────────────────────────────────────────────
const reasonOptions = ref<ClaimApi.ClaimReasonOption[]>([]);
const currencyOptions = ref<ClaimApi.ClaimCurrencyOption[]>([]);

// ─── 子组件引用 ──────────────────────────────────────────────────────────────
const createDrawerRef = ref<InstanceType<typeof CreateClaimDrawer>>();
const reviewDrawerRef = ref<InstanceType<typeof ReviewClaimDrawer>>();

// ─── Tab 状态 ────────────────────────────────────────────────────────────────
type TabKey = 'history' | 'my' | 'pending' | 'records';
const activeTab = ref<TabKey>('my');

const myClaims = ref<ClaimApi.ClaimResponse[]>([]);
const myHistory = ref<ClaimApi.ClaimResponse[]>([]);
const pendingApprovals = ref<ClaimApi.ClaimResponse[]>([]);
const approvalRecords = ref<ClaimApi.ClaimApprovalRecord[]>([]);

const segmentedOptions = computed(() => [
  { label: t('page.claim.tabs.my'), value: 'my' },
  { label: t('page.claim.tabs.history'), value: 'history' },
  { label: t('page.claim.tabs.pending'), value: 'pending' },
  { label: t('page.claim.tabs.records'), value: 'records' },
]);

const myClaimsTitle = computed(() =>
  t('page.claim.messages.myClaimsCount', { count: myClaims.value.length }),
);
const historyTitle = computed(() =>
  t('page.claim.messages.historyCount', { count: myHistory.value.length }),
);
const pendingTitle = computed(() =>
  t('page.claim.messages.pendingCount', {
    count: pendingApprovals.value.length,
  }),
);
const recordsTitle = computed(() =>
  t('page.claim.messages.recordsCount', {
    count: approvalRecords.value.length,
  }),
);

const activeTableTitle = computed(() => {
  const titles: Record<TabKey, string> = {
    history: historyTitle.value,
    my: myClaimsTitle.value,
    pending: pendingTitle.value,
    records: recordsTitle.value,
  };
  return titles[activeTab.value];
});

// ─── 状态映射 ────────────────────────────────────────────────────────────────
const statusLabelMap = computed<Record<string, string>>(() => ({
  approved: t('page.claim.status.approved'),
  pending: t('page.claim.status.pending'),
  rejected: t('page.claim.status.rejected'),
  withdrawn: t('page.claim.status.withdrawn'),
}));

const statusTypeMap: Record<
  string,
  '' | 'danger' | 'info' | 'success' | 'warning'
> = {
  approved: 'success',
  pending: 'warning',
  rejected: 'danger',
  withdrawn: 'info',
};

const actionLabelMap = computed<Record<string, string>>(() => ({
  approved: t('page.claim.action.approved'),
  created: t('page.claim.action.created'),
  rejected: t('page.claim.action.rejected'),
  withdrawn: t('page.claim.action.withdrawn'),
}));

function formatStatus(status: string) {
  return statusLabelMap.value[status] || status;
}

function formatAction(action: string) {
  return actionLabelMap.value[action] || action;
}

function formatDate(dt: null | string) {
  if (!dt) return '-';
  return dt.replace('T', ' ').slice(0, 16);
}

// ─── 表格列配置 ──────────────────────────────────────────────────────────────
const tabColumns = computed<Record<TabKey, VxeGridProps['columns']>>(() => ({
  history: [
    {
      field: 'reason_label',
      title: t('page.claim.columns.reason'),
      minWidth: 140,
      slots: { default: 'reason' },
    },
    {
      field: 'amount',
      title: t('page.claim.columns.amount'),
      minWidth: 130,
      slots: { default: 'amount' },
    },
    {
      field: 'description',
      title: t('page.claim.columns.description'),
      minWidth: 160,
      slots: { default: 'description' },
    },
    {
      field: 'approval_status',
      title: t('page.claim.columns.finalStatus'),
      width: 100,
      slots: { default: 'status' },
    },
    {
      field: 'review_comment',
      title: t('page.claim.columns.reviewComment'),
      minWidth: 140,
      slots: { default: 'review_comment' },
    },
    {
      field: 'created_at',
      title: t('page.claim.columns.submitTime'),
      width: 160,
      slots: { default: 'created_at' },
    },
  ],
  my: [
    {
      field: 'reason_label',
      title: t('page.claim.columns.reason'),
      minWidth: 140,
      slots: { default: 'reason' },
    },
    {
      field: 'amount',
      title: t('page.claim.columns.amount'),
      minWidth: 130,
      slots: { default: 'amount' },
    },
    {
      field: 'description',
      title: t('page.claim.columns.description'),
      minWidth: 160,
      slots: { default: 'description' },
    },
    {
      field: 'approval_status',
      title: t('page.claim.columns.status'),
      width: 100,
      slots: { default: 'status' },
    },
    {
      field: 'created_at',
      title: t('page.claim.columns.submitTime'),
      width: 160,
      slots: { default: 'created_at' },
    },
    {
      field: 'attachment_url',
      title: t('page.claim.columns.attachment'),
      width: 100,
      slots: { default: 'attachment' },
    },
  ],
  pending: [
    {
      field: 'employee_name',
      title: t('page.claim.columns.applicant'),
      minWidth: 150,
      slots: { default: 'employee' },
    },
    {
      field: 'reason_label',
      title: t('page.claim.columns.reason'),
      minWidth: 130,
      slots: { default: 'reason' },
    },
    {
      field: 'amount',
      title: t('page.claim.columns.amount'),
      minWidth: 130,
      slots: { default: 'amount' },
    },
    {
      field: 'description',
      title: t('page.claim.columns.description'),
      minWidth: 160,
      slots: { default: 'description' },
    },
    {
      field: 'created_at',
      title: t('page.claim.columns.submitTime'),
      width: 160,
      slots: { default: 'created_at' },
    },
    {
      title: t('page.claim.columns.operation'),
      width: 100,
      fixed: 'right',
      slots: { default: 'action' },
    },
  ],
  records: [
    {
      field: 'employee_name',
      title: t('page.claim.columns.applicant'),
      minWidth: 150,
      slots: { default: 'employee' },
    },
    {
      field: 'claim_reason_label',
      title: t('page.claim.columns.reason'),
      minWidth: 130,
      slots: { default: 'reason' },
    },
    {
      field: 'amount',
      title: t('page.claim.columns.amount'),
      minWidth: 120,
      slots: { default: 'amount' },
    },
    {
      field: 'action',
      title: t('page.claim.columns.recordOperation'),
      width: 90,
      slots: { default: 'record_action' },
    },
    {
      field: 'comment',
      title: t('page.claim.columns.remark'),
      minWidth: 140,
      slots: { default: 'comment' },
    },
    {
      field: 'created_at',
      title: t('page.claim.columns.time'),
      width: 160,
      slots: { default: 'created_at' },
    },
  ],
}));

function dataFor(tab: TabKey) {
  switch (tab) {
    case 'history': {
      return myHistory.value;
    }
    case 'my': {
      return myClaims.value;
    }
    case 'pending': {
      return pendingApprovals.value;
    }
    case 'records': {
      return approvalRecords.value;
    }
  }
}

const sharedToolbarConfig: VxeGridProps['toolbarConfig'] = {
  custom: true,
  tools: [
    {
      code: 'manual-refresh',
      icon: 'vxe-icon-refresh',
      circle: true,
      name: t('common.refresh'),
    },
  ],
};

const [BasicTable, tableApi] = useVbenVxeGrid({
  gridOptions: {
    id: 'claim-index',
    rowConfig: { keyField: 'id' },
    columns: tabColumns.value.my,
    proxyConfig: { enabled: false },
    height: 'auto',
    keepSource: true,
    toolbarConfig: sharedToolbarConfig,
  },
  gridEvents: {
    toolbarToolClick(event: { code: string }) {
      if (event.code === 'manual-refresh') reloadActiveTab();
    },
  },
});

function refreshTable() {
  tableApi.setGridOptions({
    columns: tabColumns.value[activeTab.value],
    data: dataFor(activeTab.value),
  });
}

watch(activeTab, () => {
  reloadActiveTab();
});

// Refresh table when i18n keys change
watch(
  () => [
    tabColumns.value,
    sharedToolbarConfig,
    segmentedOptions.value,
    statusLabelMap.value,
    actionLabelMap.value,
  ],
  () => {
    refreshTable();
  },
  { deep: true },
);

// ─── 新建 / 审批 ─────────────────────────────────────────────────────────────
function openCreateDrawer() {
  createDrawerRef.value?.open();
}

function openReviewDrawer(item: ClaimApi.ClaimResponse) {
  reviewDrawerRef.value?.open(item);
}

async function handleCreateSuccess() {
  await loadMyClaims();
  refreshTable();
}

async function handleReviewSuccess() {
  await loadPendingApprovals();
  await loadApprovalRecords();
  refreshTable();
}

// ─── 数据加载 ────────────────────────────────────────────────────────────────
async function fetchAll() {
  loading.value = true;
  try {
    await Promise.all([
      loadOptions(),
      loadUserInfo(),
      loadMyClaims(),
      loadMyHistory(),
      loadPendingApprovals(),
      loadApprovalRecords(),
    ]);
  } catch (error) {
    console.error('Fetch all error:', error);
  } finally {
    loading.value = false;
  }
  refreshTable();
}

async function reloadActiveTab() {
  loading.value = true;
  try {
    switch (activeTab.value) {
      case 'history': {
        await loadMyHistory();
        break;
      }
      case 'my': {
        await loadMyClaims();
        break;
      }
      case 'pending': {
        await loadPendingApprovals();
        break;
      }
      case 'records': {
        await loadApprovalRecords();
        break;
      }
    }
  } finally {
    loading.value = false;
  }
  refreshTable();
}

async function loadOptions() {
  try {
    const opts = await getClaimOptionsApi();
    reasonOptions.value = (opts as any).claim_reasons || [];
    currencyOptions.value = (opts as any).claim_currencies || [];
  } catch {
    reasonOptions.value = [];
    currencyOptions.value = [];
  }
}

async function loadUserInfo() {
  try {
    const user = await getUserInfoApi();
    userInfo.value = { username: user.username, full_name: user.realName };
  } catch {
    userInfo.value = null;
  }
}

async function loadMyClaims() {
  try {
    myClaims.value = await getMyClaimsApi();
  } catch {
    myClaims.value = [];
  }
}

async function loadMyHistory() {
  try {
    myHistory.value = await getMyClaimHistoryApi();
  } catch {
    myHistory.value = [];
  }
}

async function loadPendingApprovals() {
  try {
    pendingApprovals.value = await getMyPendingClaimApprovalsApi();
  } catch {
    pendingApprovals.value = [];
  }
}

async function loadApprovalRecords() {
  try {
    approvalRecords.value = await getMyClaimApprovalRecordsApi();
  } catch {
    approvalRecords.value = [];
  }
}

onMounted(() => {
  fetchAll();
});
</script>

<template>
  <Page
    :title="$t('page.claim.title')"
    :description="$t('page.claim.description')"
    :auto-content-height="true"
    v-loading="loading"
  >
    <div class="flex h-full flex-col gap-2">
      <ElSegmented v-model="activeTab" :options="segmentedOptions" />
      <p v-if="userInfo" class="text-sm text-muted-foreground">
        {{
          $t('page.claim.messages.currentUser', {
            fullName: userInfo.full_name,
            username: userInfo.username,
          })
        }}
      </p>

      <BasicTable :table-title="activeTableTitle" class="min-h-0 flex-1">
        <template #toolbar-tools>
          <ElButton
            v-if="activeTab === 'my'"
            type="primary"
            @click="openCreateDrawer"
          >
            {{ $t('page.claim.buttons.create') }}
          </ElButton>
        </template>
        <template #reason="{ row }">
          <strong v-if="activeTab === 'my' || activeTab === 'history'">
            {{ row.reason_label }}
          </strong>
          <template v-else>
            {{ row.claim_reason_label || row.reason_label }}
          </template>
        </template>
        <template #amount="{ row }">
          <span>{{ row.amount.toFixed(2) }} {{ row.currency }}</span>
          <span
            v-if="row.amount_hkd"
            class="block text-xs text-muted-foreground"
          >
            ≈ HKD {{ row.amount_hkd.toFixed(2) }}
          </span>
        </template>
        <template #description="{ row }">
          {{ row.description || '-' }}
        </template>
        <template #status="{ row }">
          <ElTag :type="statusTypeMap[row.approval_status] || 'info'">
            {{ formatStatus(row.approval_status) }}
          </ElTag>
        </template>
        <template #created_at="{ row }">
          {{ formatDate(row.created_at) }}
        </template>
        <template #attachment="{ row }">
          <a
            v-if="row.attachment_url"
            :href="row.attachment_url"
            target="_blank"
          >
            {{ row.attachment_name || $t('page.claim.buttons.view') }}
          </a>
          <span v-else>-</span>
        </template>
        <template #review_comment="{ row }">
          {{ row.review_comment || '-' }}
        </template>
        <template #employee="{ row }">
          <strong>{{ row.employee_name }}</strong>
          <span class="block text-xs text-muted-foreground">
            {{ row.employee_username }}
          </span>
        </template>
        <template #action="{ row }">
          <ElButton
            size="small"
            type="primary"
            @click="openReviewDrawer(row as ClaimApi.ClaimResponse)"
          >
            {{ $t('page.claim.buttons.review') }}
          </ElButton>
        </template>
        <template #record_action="{ row }">
          <ElTag
            :type="
              row.action === 'approved'
                ? 'success'
                : row.action === 'rejected'
                  ? 'danger'
                  : 'info'
            "
          >
            {{ formatAction(row.action) }}
          </ElTag>
        </template>
        <template #comment="{ row }">
          {{ row.comment || '-' }}
        </template>
      </BasicTable>
    </div>

    <!-- 新建报销抽屉 -->
    <CreateClaimDrawer
      ref="createDrawerRef"
      :currency-options="currencyOptions"
      :reason-options="reasonOptions"
      @success="handleCreateSuccess"
    />

    <!-- 审批抽屉 -->
    <ReviewClaimDrawer ref="reviewDrawerRef" @success="handleReviewSuccess" />
  </Page>
</template>
