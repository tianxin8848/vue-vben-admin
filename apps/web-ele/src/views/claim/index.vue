<script lang="ts" setup>
import type { ClaimApi } from '#/api';

import { computed, ref, watch } from 'vue';

import { Page } from '@vben/common-ui';
import { useI18n } from '@vben/locales';

import { ElButton, ElSegmented, ElTag } from 'element-plus';

import { useVbenVxeGrid } from '#/adapter/vxe-table';

import CreateClaimDrawer from './components/CreateClaimDrawer.vue';
import ReviewClaimDrawer from './components/ReviewClaimDrawer.vue';
import { useClaimActions } from './composables/useClaimActions';
import { useClaimData } from './composables/useClaimData';
import {
  buildActionLabelMap,
  buildSegmentedOptions,
  buildSharedToolbarConfig,
  buildStatusLabelMap,
  buildTabColumns,
  buildTableTitles,
  dataFor,
  formatAction,
  formatDate,
  formatStatus,
  statusTypeMap,
} from './data';

const { t } = useI18n();

// ─── 数据层（Tab 状态 + API 加载） ───────────────────────────────────────────
const data = useClaimData();

// ─── 操作层（撤回 + 导出） ───────────────────────────────────────────────────
const { actionLoading, handleExport, handleWithdraw } = useClaimActions();

// ─── 统一 loading：数据加载 + 操作进行中 ──────────────────────────────────────
const isLoading = computed(() => data.loading.value || actionLoading.value);

// ─── 表格列 / 工具栏等 i18n 相关配置（来自 data.ts） ──────────────────────────
const tabColumns = computed(() => buildTabColumns(t));
const segmentedOptions = computed(() => buildSegmentedOptions(t));
const sharedToolbarConfig = computed(() => buildSharedToolbarConfig(t));
const statusLabelMap = computed(() => buildStatusLabelMap(t));
const actionLabelMap = computed(() => buildActionLabelMap(t));
const activeTableTitle = computed(
  () => buildTableTitles(t, data.tabLengths())[data.activeTab.value],
);

// ─── 子组件引用 ──────────────────────────────────────────────────────────────
const createDrawerRef = ref<InstanceType<typeof CreateClaimDrawer>>();
const reviewDrawerRef = ref<InstanceType<typeof ReviewClaimDrawer>>();

// ─── 表格实例 ────────────────────────────────────────────────────────────────

const [BasicTable, tableApi] = useVbenVxeGrid({
  gridOptions: {
    id: 'claim-index',
    rowConfig: { keyField: 'id' },
    columns: tabColumns.value.my,
    proxyConfig: { enabled: false },
    height: 'auto',
    keepSource: true,
    toolbarConfig: sharedToolbarConfig.value,
  },
  gridEvents: {
    toolbarToolClick(event: { code: string }) {
      if (event.code === 'manual-refresh') data.reloadActiveTab();
    },
  },
});

function refreshTable() {
  tableApi.setGridOptions({
    columns: tabColumns.value[data.activeTab.value],
    data: dataFor(data.activeTab.value, data.dataRefs()),
  });
}

// Tab 切换 / 数据变化后刷新表格
watch(
  () => [
    data.activeTab.value,
    data.myClaims.value,
    data.myHistory.value,
    data.pendingApprovals.value,
    data.approvalRecords.value,
  ],
  () => refreshTable(),
  { deep: true },
);

// 国际化变化时重刷列名
watch(
  () => [tabColumns.value, sharedToolbarConfig.value],
  () => refreshTable(),
);

// ─── 新建 / 审批抽屉 ─────────────────────────────────────────────────────────
function openCreateDrawer() {
  createDrawerRef.value?.open();
}
function openReviewDrawer(item: ClaimApi.ClaimResponse) {
  reviewDrawerRef.value?.open(item);
}
async function handleCreateSuccess() {
  await data.loadMyClaims();
  refreshTable();
}
async function handleReviewSuccess() {
  await data.loadPendingApprovals();
  await data.loadApprovalRecords();
  refreshTable();
}

// ─── 撤回：调用 action 后重载当前 Tab ────────────────────────────────────────
async function onWithdraw(item: ClaimApi.ClaimResponse) {
  const ok = await handleWithdraw(item);
  if (ok) {
    await data.loadMyClaims();
    refreshTable();
  }
}
</script>

<template>
  <Page
    :title="$t('page.claim.title')"
    :description="$t('page.claim.description')"
    :auto-content-height="true"
    v-loading="isLoading"
  >
    <div class="flex h-full flex-col gap-2">
      <ElSegmented v-model="data.activeTab.value" :options="segmentedOptions" />
      <p v-if="data.userInfo.value" class="text-sm text-muted-foreground">
        {{
          $t('page.claim.messages.currentUser', {
            fullName: data.userInfo.value.full_name,
            username: data.userInfo.value.username,
          })
        }}
      </p>

      <BasicTable :table-title="activeTableTitle" class="min-h-0 flex-1">
        <template #toolbar-tools>
          <ElButton
            v-if="data.activeTab.value === 'my'"
            type="primary"
            @click="openCreateDrawer"
          >
            {{ $t('page.claim.buttons.create') }}
          </ElButton>
          <ElButton :loading="isLoading" @click="handleExport">
            {{ $t('page.claim.buttons.export') }}
          </ElButton>
        </template>
        <template #reason="{ row }">
          <strong
            v-if="
              data.activeTab.value === 'my' ||
              data.activeTab.value === 'history'
            "
          >
            {{ row.reason_label }}
          </strong>
          <template v-else>
            {{ row.claim_reason_label || row.reason_label }}
          </template>
        </template>
        <template #invoice_date="{ row }">
          {{ row.invoice_date || '-' }}
        </template>
        <template #invoice_no="{ row }">
          {{ row.invoice_no || '-' }}
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
            {{ formatStatus(row.approval_status, statusLabelMap) }}
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
        <template #my_action="{ row }">
          <ElButton
            v-if="row.approval_status === 'pending'"
            size="small"
            type="danger"
            :loading="isLoading"
            @click="onWithdraw(row as ClaimApi.ClaimResponse)"
          >
            {{ $t('page.claim.buttons.withdraw') }}
          </ElButton>
          <span v-else>-</span>
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
            {{ formatAction(row.action, actionLabelMap) }}
          </ElTag>
        </template>
        <template #comment="{ row }">
          {{ row.comment || '-' }}
        </template>
      </BasicTable>
    </div>

    <CreateClaimDrawer
      ref="createDrawerRef"
      :currency-options="data.currencyOptions.value"
      :reason-options="data.reasonOptions.value"
      @success="handleCreateSuccess"
    />
    <ReviewClaimDrawer ref="reviewDrawerRef" @success="handleReviewSuccess" />
  </Page>
</template>
