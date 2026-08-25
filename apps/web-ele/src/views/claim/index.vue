<script lang="ts" setup>
import type { ClaimApi } from '#/api';

import { computed, ref, watch } from 'vue';

import { Page } from '@vben/common-ui';
import { useI18n } from '@vben/locales';

import { ElButton, ElSegmented, ElTag } from 'element-plus';

import { useVbenVxeGrid } from '#/adapter/vxe-table';

import CreateClaimDrawer from './components/CreateClaimDrawer.vue';
import EditClaimDrawer from './components/EditClaimDrawer.vue';
import { useClaimActions } from './composables/useClaimActions';
import { useClaimData } from './composables/useClaimData';
import {
  buildSegmentedOptions,
  buildSharedToolbarConfig,
  buildStatusLabelMap,
  buildTabColumns,
  buildTableTitles,
  dataFor,
  formatDate,
  formatStatus,
  statusTypeMap,
} from './data';

const { t } = useI18n();

// ─── 数据层（Tab 状态 + API 加载） ───────────────────────────────────────────
const data = useClaimData();

// ─── 操作层（撤回 + 提交 + 删除 + 导出） ──────────────────────────────────────
const {
  actionLoading,
  handleDeleteDraft,
  handleExport,
  handleSubmitBatch,
  handleSubmitSingle,
  handleWithdraw,
} = useClaimActions();

// ─── 统一 loading：数据加载 + 操作进行中 ──────────────────────────────────────
const isLoading = computed(() => data.loading.value || actionLoading.value);

// ─── 表格列 / 工具栏等 i18n 相关配置（来自 data.ts） ──────────────────────────
const tabColumns = computed(() => buildTabColumns(t));
const segmentedOptions = computed(() => buildSegmentedOptions(t));
const sharedToolbarConfig = computed(() => buildSharedToolbarConfig(t));
const statusLabelMap = computed(() => buildStatusLabelMap(t));
const activeTableTitle = computed(
  () => buildTableTitles(t, data.tabLengths())[data.activeTab.value],
);

// ─── 子组件引用 ──────────────────────────────────────────────────────────────
const createDrawerRef = ref<InstanceType<typeof CreateClaimDrawer>>();
const editDrawerRef = ref<InstanceType<typeof EditClaimDrawer>>();

// ─── 批量提交：选中的草稿 ─────────────────────────────────────────────────────
const selectedDraftCount = ref(0);

function updateSelection() {
  const records = tableApi.grid?.getCheckboxRecords() ?? [];
  selectedDraftCount.value = records.length;
}

function selectedDraftIds() {
  const records = tableApi.grid?.getCheckboxRecords() ?? [];
  return records.map((r: any) => r.id);
}

// ─── 表格实例 ────────────────────────────────────────────────────────────────

const [BasicTable, tableApi] = useVbenVxeGrid({
  gridOptions: {
    id: 'claim-index',
    rowConfig: { keyField: 'id' },
    columns: tabColumns.value.my,
    proxyConfig: { enabled: false },
    keepSource: true,
    toolbarConfig: sharedToolbarConfig.value,
    // 仅草稿可勾选（用于批量提交）
    checkboxConfig: {
      highlight: true,
      checkMethod: ({ row }: { row: ClaimApi.ClaimResponse }) =>
        row.approval_status === 'draft',
    },
  },
  gridEvents: {
    checkboxAll() {
      updateSelection();
    },
    checkboxChange() {
      updateSelection();
    },
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
  selectedDraftCount.value = 0;
}

// Tab 切换 / 数据变化后刷新表格
watch(
  () => [data.activeTab.value, data.myClaims.value, data.myHistory.value],
  () => refreshTable(),
  { deep: true },
);

// 国际化变化时重刷列名
watch(
  () => [tabColumns.value, sharedToolbarConfig.value],
  () => refreshTable(),
);

// ─── 新建 / 编辑 ─────────────────────────────────────────────────────────────
function openCreateDrawer() {
  createDrawerRef.value?.open();
}
function openEditDrawer(item: ClaimApi.ClaimResponse) {
  editDrawerRef.value?.open(item);
}
async function handleCreateSuccess() {
  await data.loadMyClaims();
  refreshTable();
}
async function handleEditSuccess() {
  await data.loadMyClaims();
  refreshTable();
}

// ─── 我的报销操作：提交 / 删除 / 撤回 / 批量提交 ──────────────────────────────
async function onSubmitSingle(item: ClaimApi.ClaimResponse) {
  const ok = await handleSubmitSingle(item);
  if (ok) {
    await data.loadMyClaims();
    refreshTable();
  }
}

async function onDeleteDraft(item: ClaimApi.ClaimResponse) {
  const ok = await handleDeleteDraft(item);
  if (ok) {
    await data.loadMyClaims();
    refreshTable();
  }
}

async function onWithdraw(item: ClaimApi.ClaimResponse) {
  const ok = await handleWithdraw(item);
  if (ok) {
    await data.loadMyClaims();
    await data.loadMyHistory();
    refreshTable();
  }
}

async function onBatchSubmit() {
  const ids = selectedDraftIds();
  const ok = await handleSubmitBatch(ids);
  if (ok) {
    await data.loadMyClaims();
    refreshTable();
  }
}
</script>

<template>
  <Page>
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
          <ElButton
            v-if="data.activeTab.value === 'my'"
            type="success"
            :disabled="selectedDraftCount === 0"
            :loading="isLoading"
            @click="onBatchSubmit"
          >
            {{ $t('page.claim.buttons.batchSubmit') }}
            <span v-if="selectedDraftCount > 0">（{{ selectedDraftCount }}）</span>
          </ElButton>
          <ElButton :loading="isLoading" @click="handleExport">
            {{ $t('page.claim.buttons.export') }}
          </ElButton>
        </template>
        <template #reason="{ row }">
          <strong>{{ row.reason_label }}</strong>
        </template>
        <template #items="{ row }">
          <span v-if="row.items && row.items.length > 0">
            {{
              $t('page.claim.messages.itemsCount', { count: row.items.length })
            }}
          </span>
          <span v-else>-</span>
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
        <template #invoice_date="{ row }">
          {{ row.invoice_date || '-' }}
        </template>
        <template #invoice_no="{ row }">
          {{ row.invoice_no || '-' }}
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
        <template #my_action="{ row }">
          <template v-if="row.approval_status === 'draft'">
            <ElButton
              size="small"
              type="primary"
              :loading="isLoading"
              @click="openEditDrawer(row as ClaimApi.ClaimResponse)"
            >
              {{ $t('page.claim.buttons.edit') }}
            </ElButton>
            <ElButton
              size="small"
              type="success"
              :loading="isLoading"
              @click="onSubmitSingle(row as ClaimApi.ClaimResponse)"
            >
              {{ $t('page.claim.buttons.submit') }}
            </ElButton>
            <ElButton
              size="small"
              type="danger"
              :loading="isLoading"
              @click="onDeleteDraft(row as ClaimApi.ClaimResponse)"
            >
              {{ $t('page.claim.buttons.delete') }}
            </ElButton>
          </template>
          <ElButton
            v-else-if="row.approval_status === 'pending'"
            size="small"
            type="warning"
            :loading="isLoading"
            @click="onWithdraw(row as ClaimApi.ClaimResponse)"
          >
            {{ $t('page.claim.buttons.withdraw') }}
          </ElButton>
          <span v-else>-</span>
        </template>
      </BasicTable>
    </div>

    <CreateClaimDrawer
      ref="createDrawerRef"
      :currency-options="data.currencyOptions.value"
      :reason-options="data.reasonOptions.value"
      @success="handleCreateSuccess"
    />
    <EditClaimDrawer ref="editDrawerRef" @success="handleEditSuccess" />
  </Page>
</template>
