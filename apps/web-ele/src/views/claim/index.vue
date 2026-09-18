<script lang="ts" setup>
import type { ClaimApi } from '#/api';

import { computed, ref, watch } from 'vue';

import { Page } from '@vben/common-ui';
import { useI18n } from '@vben/locales';

import {
  ElButton,
  ElDatePicker,
  ElOption,
  ElSegmented,
  ElSelect,
  ElTag,
} from 'element-plus';

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
  filterByInvoiceDate,
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
  handleOrgExport,
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

// ─── 批量提交 / 导出：选中的草稿 / 已通过记录 ─────────────────────────────────
const selectedDraftCount = ref(0);
const selectedApprovedCount = ref(0);

// ─── 组织级导出分组方式（按提交月 / 按人+提交月） ──────────────────────────────
const orgExportGroup = ref<'month' | 'person_month'>('month');

// ─── 日期范围筛选（按 invoice_date 客户端过滤） ──────────────────────────────
const dateRange = ref<[string, string] | null>(null);
const isFilterActive = computed(
  () => !!dateRange.value && (!!dateRange.value[0] || !!dateRange.value[1]),
);
const filteredCount = computed(() => {
  if (!isFilterActive.value) return 0;
  const all = dataFor(data.activeTab.value, data.dataRefs());
  return filterByInvoiceDate(all, dateRange.value).length;
});

// ─── 快速日期筛选：近7天 / 近1月 / 近3月 ─────────────────────────────────────
function setQuickRange(type: '1m' | '3m' | '7d') {
  const end = new Date();
  const start = new Date();
  if (type === '7d') {
    start.setDate(start.getDate() - 7);
  } else if (type === '1m') {
    start.setMonth(start.getMonth() - 1);
  } else if (type === '3m') {
    start.setMonth(start.getMonth() - 3);
  }
  const fmt = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };
  dateRange.value = [fmt(start), fmt(end)];
}

function updateSelection() {
  const records = tableApi.grid?.getCheckboxRecords() ?? [];
  if (data.activeTab.value === 'my') {
    selectedDraftCount.value = records.filter(
      (r: any) => r.approval_status === 'draft',
    ).length;
    selectedApprovedCount.value = 0;
  } else {
    selectedApprovedCount.value = records.filter(
      (r: any) => r.approval_status === 'approved',
    ).length;
    selectedDraftCount.value = 0;
  }
}

function selectedDraftIds() {
  const records = tableApi.grid?.getCheckboxRecords() ?? [];
  return records
    .filter((r: any) => r.approval_status === 'draft')
    .map((r: any) => r.id);
}

function selectedApprovedIds() {
  const records = tableApi.grid?.getCheckboxRecords() ?? [];
  return records
    .filter((r: any) => r.approval_status === 'approved')
    .map((r: any) => r.id);
}

// ─── 动态 checkbox 配置：按 Tab 限定可勾选的行 ────────────────────────────────
function currentCheckMethod({ row }: { row: ClaimApi.ClaimResponse }) {
  return data.activeTab.value === 'my'
    ? row.approval_status === 'draft'
    : row.approval_status === 'approved';
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
    // 按 Tab 动态决定可勾选的行
    checkboxConfig: {
      highlight: true,
      checkMethod: ({ row }: { row: ClaimApi.ClaimResponse }) =>
        currentCheckMethod({ row }),
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
  const rawData = dataFor(data.activeTab.value, data.dataRefs());
  const filteredData = filterByInvoiceDate(rawData, dateRange.value);
  tableApi.setGridOptions({
    columns: tabColumns.value[data.activeTab.value],
    data: filteredData,
    checkboxConfig: {
      highlight: true,
      checkMethod: ({ row }: { row: ClaimApi.ClaimResponse }) =>
        currentCheckMethod({ row }),
    },
  });
  // 清除勾选计数
  selectedDraftCount.value = 0;
  selectedApprovedCount.value = 0;
  // 清除表格中的勾选状态
  tableApi.grid?.clearCheckboxRow();
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

// 日期筛选变化时重刷表格
watch(dateRange, () => refreshTable(), { deep: true });

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

/**
 * 导出按钮处理：
 * - 在「我的报销」Tab：导出全部已通过（approved）记录
 * - 在「历史记录」Tab：
 *   - 若勾选了已通过记录 → 导出选中的
 *   - 若未勾选 → 导出全部已通过
 */
async function onExport() {
  const ids = data.activeTab.value === 'history' ? selectedApprovedIds() : [];
  await handleExport(ids.length > 0 ? ids : undefined);
}

/**
 * 组织级导出（跨员工，仅已通过）：GET /claims/export?group=...
 * 按提交月份（created_at）分 sheet。按钮受 canOrgExport 控制（后端 claim_management / claim_org_export）。
 */
async function onOrgExport() {
  await handleOrgExport(orgExportGroup.value);
}
</script>

<template>
  <Page>
    <div class="flex h-full flex-col gap-2">
      <ElSegmented v-model="data.activeTab.value" :options="segmentedOptions" />

      <!-- 按开票时间筛选发票 -->
      <div class="flex flex-wrap items-center gap-2">
        <span class="text-sm text-muted-foreground">
          {{ $t('page.claim.filter.dateRange') }}
        </span>
        <ElDatePicker
          v-model="dateRange"
          type="daterange"
          range-separator="-"
          :start-placeholder="$t('page.claim.filter.dateRangePlaceholder')"
          :end-placeholder="$t('page.claim.filter.dateRangePlaceholder')"
          value-format="YYYY-MM-DD"
          clearable
          style="width: 280px"
        />
        <ElButton size="small" @click="setQuickRange('7d')">
          {{ $t('page.claim.filter.quick7d') }}
        </ElButton>
        <ElButton size="small" @click="setQuickRange('1m')">
          {{ $t('page.claim.filter.quick1m') }}
        </ElButton>
        <ElButton size="small" @click="setQuickRange('3m')">
          {{ $t('page.claim.filter.quick3m') }}
        </ElButton>
        <ElButton v-if="isFilterActive" size="small" @click="dateRange = null">
          {{ $t('page.claim.filter.reset') }}
        </ElButton>
        <span v-if="isFilterActive" class="text-xs text-muted-foreground">
          {{ $t('page.claim.filter.filteredCount', { count: filteredCount }) }}
        </span>
      </div>

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
          <ElButton
            v-if="data.activeTab.value === 'history'"
            :loading="isLoading"
            @click="onExport"
          >
            {{ $t('page.claim.buttons.export') }}
            <span
              v-if="
                data.activeTab.value === 'history' && selectedApprovedCount > 0
              "
            >
              （{{ selectedApprovedCount }}）
            </span>
          </ElButton>
          <!-- 组织级导出：需 claim_management / claim_org_export（内置 admin 不显示） -->
          <template
            v-if="data.activeTab.value === 'history' && data.canOrgExport.value"
          >
            <span
              class="text-sm text-muted-foreground"
              :title="$t('page.claim.exportGroup.hint')"
            >
              {{ $t('page.claim.exportGroup.label') }}
            </span>
            <ElSelect v-model="orgExportGroup" style="width: 150px">
              <ElOption
                :label="$t('page.claim.exportGroup.month')"
                value="month"
              />
              <ElOption
                :label="$t('page.claim.exportGroup.personMonth')"
                value="person_month"
              />
            </ElSelect>
            <ElButton type="success" :loading="isLoading" @click="onOrgExport">
              {{ $t('page.claim.buttons.exportAll') }}
            </ElButton>
          </template>
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
          <div class="flex shrink-0 flex-nowrap items-center gap-1">
            <template v-if="row.approval_status === 'draft'">
              <ElButton
                size="small"
                type="primary"
                class="shrink-0"
                style="white-space: nowrap"
                :loading="isLoading"
                @click="openEditDrawer(row as ClaimApi.ClaimResponse)"
              >
                {{ $t('page.claim.buttons.edit') }}
              </ElButton>
              <ElButton
                size="small"
                type="success"
                class="shrink-0"
                style="white-space: nowrap"
                :loading="isLoading"
                @click="onSubmitSingle(row as ClaimApi.ClaimResponse)"
              >
                {{ $t('page.claim.buttons.submit') }}
              </ElButton>
              <ElButton
                size="small"
                type="danger"
                class="shrink-0"
                style="white-space: nowrap"
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
              class="shrink-0"
              style="white-space: nowrap"
              :loading="isLoading"
              @click="onWithdraw(row as ClaimApi.ClaimResponse)"
            >
              {{ $t('page.claim.buttons.withdraw') }}
            </ElButton>
            <span v-else>-</span>
          </div>
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
