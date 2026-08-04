<script lang="ts" setup>
import type { VxeGridProps } from '#/adapter/vxe-table';
import type { ClaimApi } from '#/api';

import { computed, onMounted, ref, watch } from 'vue';

import { Page } from '@vben/common-ui';

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
  { label: '我的报销', value: 'my' },
  { label: '历史记录', value: 'history' },
  { label: '待我审批', value: 'pending' },
  { label: '审批记录', value: 'records' },
]);

const myClaimsTitle = computed(() => `我的报销（${myClaims.value.length} 条）`);
const historyTitle = computed(() => `历史记录（${myHistory.value.length} 条）`);
const pendingTitle = computed(
  () => `待我审批（${pendingApprovals.value.length} 条）`,
);
const recordsTitle = computed(
  () => `审批记录（${approvalRecords.value.length} 条）`,
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
const statusLabelMap: Record<string, string> = {
  approved: '已通过',
  pending: '审批中',
  rejected: '已驳回',
  withdrawn: '已撤回',
};

const statusTypeMap: Record<
  string,
  '' | 'danger' | 'info' | 'success' | 'warning'
> = {
  approved: 'success',
  pending: 'warning',
  rejected: 'danger',
  withdrawn: 'info',
};

const actionLabelMap: Record<string, string> = {
  approved: '通过',
  created: '提交',
  rejected: '驳回',
  withdrawn: '撤回',
};

function formatStatus(status: string) {
  return statusLabelMap[status] || status;
}

function formatAction(action: string) {
  return actionLabelMap[action] || action;
}

function formatDate(dt: null | string) {
  if (!dt) return '-';
  return dt.replace('T', ' ').slice(0, 16);
}

// ─── 表格列配置 ──────────────────────────────────────────────────────────────
const tabColumns: Record<TabKey, VxeGridProps['columns']> = {
  history: [
    {
      field: 'reason_label',
      title: '报销理由',
      minWidth: 140,
      slots: { default: 'reason' },
    },
    {
      field: 'amount',
      title: '金额',
      minWidth: 130,
      slots: { default: 'amount' },
    },
    {
      field: 'description',
      title: '说明',
      minWidth: 160,
      slots: { default: 'description' },
    },
    {
      field: 'approval_status',
      title: '最终状态',
      width: 100,
      slots: { default: 'status' },
    },
    {
      field: 'review_comment',
      title: '审批意见',
      minWidth: 140,
      slots: { default: 'review_comment' },
    },
    {
      field: 'created_at',
      title: '提交时间',
      width: 160,
      slots: { default: 'created_at' },
    },
  ],
  my: [
    {
      field: 'reason_label',
      title: '报销理由',
      minWidth: 140,
      slots: { default: 'reason' },
    },
    {
      field: 'amount',
      title: '金额',
      minWidth: 130,
      slots: { default: 'amount' },
    },
    {
      field: 'description',
      title: '说明',
      minWidth: 160,
      slots: { default: 'description' },
    },
    {
      field: 'approval_status',
      title: '状态',
      width: 100,
      slots: { default: 'status' },
    },
    {
      field: 'created_at',
      title: '提交时间',
      width: 160,
      slots: { default: 'created_at' },
    },
    {
      field: 'attachment_url',
      title: '附件',
      width: 100,
      slots: { default: 'attachment' },
    },
  ],
  pending: [
    {
      field: 'employee_name',
      title: '申请人',
      minWidth: 150,
      slots: { default: 'employee' },
    },
    {
      field: 'reason_label',
      title: '报销理由',
      minWidth: 130,
      slots: { default: 'reason' },
    },
    {
      field: 'amount',
      title: '金额',
      minWidth: 130,
      slots: { default: 'amount' },
    },
    {
      field: 'description',
      title: '说明',
      minWidth: 160,
      slots: { default: 'description' },
    },
    {
      field: 'created_at',
      title: '提交时间',
      width: 160,
      slots: { default: 'created_at' },
    },
    {
      title: '操作',
      width: 100,
      fixed: 'right',
      slots: { default: 'action' },
    },
  ],
  records: [
    {
      field: 'employee_name',
      title: '申请人',
      minWidth: 150,
      slots: { default: 'employee' },
    },
    {
      field: 'claim_reason_label',
      title: '报销理由',
      minWidth: 130,
      slots: { default: 'reason' },
    },
    {
      field: 'amount',
      title: '金额',
      minWidth: 120,
      slots: { default: 'amount' },
    },
    {
      field: 'action',
      title: '操作',
      width: 90,
      slots: { default: 'record_action' },
    },
    {
      field: 'comment',
      title: '备注',
      minWidth: 140,
      slots: { default: 'comment' },
    },
    {
      field: 'created_at',
      title: '时间',
      width: 160,
      slots: { default: 'created_at' },
    },
  ],
};

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
      name: '刷新',
    },
  ],
};

const [BasicTable, tableApi] = useVbenVxeGrid({
  gridOptions: {
    id: 'claim-index',
    rowConfig: { keyField: 'id' },
    columns: tabColumns.my,
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
    columns: tabColumns[activeTab.value],
    data: dataFor(activeTab.value),
  });
}

watch(activeTab, () => {
  reloadActiveTab();
});

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
    title="报销管理"
    description="提交报销申请、查看审批进度与历史记录"
    :auto-content-height="true"
    v-loading="loading"
  >
    <div class="flex h-full flex-col gap-2">
      <ElSegmented v-model="activeTab" :options="segmentedOptions" />
      <p v-if="userInfo" class="text-sm text-muted-foreground">
        当前用户：{{ userInfo.full_name }}（{{ userInfo.username }}）
      </p>

      <BasicTable :table-title="activeTableTitle" class="min-h-0 flex-1">
        <template #toolbar-tools>
          <ElButton
            v-if="activeTab === 'my'"
            type="primary"
            @click="openCreateDrawer"
          >
            新建报销申请
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
            {{ row.attachment_name || '查看' }}
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
            审批
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
