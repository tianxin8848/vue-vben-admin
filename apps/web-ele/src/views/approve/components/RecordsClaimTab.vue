<script lang="ts" setup>
import type { SearchForm } from '../constants';

import type { VxeGridProps } from '#/adapter/vxe-table';
import type { ClaimApi } from '#/api';

import { computed, watch } from 'vue';

import { useI18n } from '@vben/locales';

import { ElButton, ElOption, ElSelect, ElTag } from 'element-plus';

import { useVbenVxeGrid } from '#/adapter/vxe-table';

import { useOrgExport } from '../../claim/composables/useOrgExport';
import {
  actionLabelMap,
  actionTypeMap,
  statusLabelMap,
  statusTypeMap,
} from '../constants';

const props = defineProps<{
  data: ClaimApi.ClaimApprovalRecord[];
  searchForm: SearchForm;
}>();

const { t } = useI18n();

// ─── 组织级报销导出（全员，支持按员工 / 分组方式筛选） ──────────────────────────
const {
  loading: orgExportLoading,
  canOrgExport,
  orgExportEmployeeOptions,
  orgExportGroup,
  orgExportEmployee,
  onOrgExport,
} = useOrgExport();

/** Records Claim 只显示已通过（approved）和已拒绝（rejected），排除 pending/withdrawn */
const RECORDS_CLAIM_ALLOWED_STATUSES = new Set(['approved', 'rejected']);

function applyFilters() {
  const kw = props.searchForm.keyword.trim().toLowerCase();
  return props.data.filter((row) => {
    // Records Claim 只保留 approved / rejected
    if (!RECORDS_CLAIM_ALLOWED_STATUSES.has(row.approval_status_after))
      return false;
    if (
      props.searchForm.status &&
      row.approval_status_after !== props.searchForm.status
    )
      return false;
    if (
      props.searchForm.department &&
      row.employee_department !== props.searchForm.department
    )
      return false;
    if (
      props.searchForm.region &&
      row.employee_region !== props.searchForm.region
    )
      return false;
    if (!kw) return true;
    const hay = [
      row.employee_name,
      row.employee_username,
      row.employee_department,
      row.employee_region,
      row.claim_reason_label,
      row.comment,
      row.operator_name,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return hay.includes(kw);
  });
}

const tableColumns = computed<
  VxeGridProps<ClaimApi.ClaimApprovalRecord>['columns']
>(() => [
  {
    field: 'employee_username',
    title: t('page.approve.recordsClaimTab.column.account'),
    width: 120,
  },
  {
    field: 'claim_reason_label',
    title: t('page.approve.recordsClaimTab.column.reason'),
    width: 120,
  },
  {
    field: 'amount',
    title: t('page.approve.recordsClaimTab.column.amount'),
    width: 160,
    slots: { default: 'amount' },
  },
  {
    field: 'action',
    title: t('page.approve.recordsClaimTab.column.myAction'),
    width: 100,
    slots: { default: 'action' },
  },
  {
    field: 'approval_status_after',
    title: t('page.approve.recordsClaimTab.column.currentStatus'),
    width: 100,
    slots: { default: 'status' },
  },
  {
    field: 'comment',
    title: t('page.approve.recordsClaimTab.column.comment'),
    minWidth: 150,
  },
  {
    field: 'created_at',
    title: t('page.approve.recordsClaimTab.column.processedAt'),
    width: 170,
    slots: { default: 'created_at' },
  },
]);

const [BasicTable, tableApi] = useVbenVxeGrid<ClaimApi.ClaimApprovalRecord>({
  gridOptions: {
    id: 'approve-records-claim',
    rowConfig: { keyField: 'id' },
    columns: tableColumns.value,
    proxyConfig: {
      enabled: true,
      ajax: {
        query: ({
          page,
        }: {
          page: { currentPage: number; pageSize: number };
        }) => {
          const { currentPage, pageSize } = page;
          const filtered = applyFilters();
          const start = (currentPage - 1) * pageSize;
          return Promise.resolve({
            items: filtered.slice(start, start + pageSize),
            total: filtered.length,
          });
        },
      },
    },
    pagerConfig: { pageSize: 10, pageSizes: [10, 20, 50] },
    toolbarConfig: { custom: true },
  },
});

watch(
  () => [
    props.data,
    props.searchForm.keyword,
    props.searchForm.status,
    props.searchForm.leave_type,
    props.searchForm.department,
    props.searchForm.region,
  ],
  () => tableApi.query(),
  { deep: true },
);

watch(tableColumns, () => {
  tableApi.setGridOptions({ columns: tableColumns.value });
});
</script>

<template>
  <BasicTable
    :table-title="
      t('page.approve.recordsClaimTab.listTitle', { count: data.length })
    "
  >
    <template #toolbar-tools>
      <template v-if="canOrgExport">
        <span
          class="text-sm text-muted-foreground"
          :title="t('page.claim.exportEmployee.hint')"
        >
          {{ t('page.claim.exportEmployee.label') }}
        </span>
        <ElSelect v-model="orgExportEmployee" style="width: 200px" filterable>
          <ElOption
            v-for="opt in orgExportEmployeeOptions"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </ElSelect>
        <span
          class="text-sm text-muted-foreground"
          :title="t('page.claim.exportGroup.hint')"
        >
          {{ t('page.claim.exportGroup.label') }}
        </span>
        <ElSelect v-model="orgExportGroup" style="width: 150px">
          <ElOption :label="t('page.claim.exportGroup.month')" value="month" />
          <ElOption
            :label="t('page.claim.exportGroup.personMonth')"
            value="person_month"
          />
        </ElSelect>
        <ElButton
          type="success"
          :loading="orgExportLoading"
          @click="onOrgExport"
        >
          {{ t('page.claim.buttons.exportAll') }}
        </ElButton>
      </template>
    </template>
    <template #amount="{ row }">
      <div>{{ row.amount.toFixed(2) }} {{ row.currency }}</div>
      <div v-if="row.amount_hkd" class="text-xs text-muted-foreground">
        ≈ HKD {{ row.amount_hkd.toFixed(2) }}
      </div>
    </template>
    <template #action="{ row }">
      <ElTag :type="actionTypeMap[row.action] || 'info'">
        {{ t(actionLabelMap[row.action] || row.action) }}
      </ElTag>
    </template>
    <template #status="{ row }">
      <ElTag :type="statusTypeMap[row.approval_status_after] || 'info'">
        {{
          t(
            statusLabelMap[row.approval_status_after] ||
              row.approval_status_after,
          )
        }}
      </ElTag>
    </template>
    <template #created_at="{ row }">
      {{
        row.created_at ? new Date(row.created_at).toLocaleString('zh-CN') : '-'
      }}
    </template>
  </BasicTable>
</template>

<style scoped>
.text-xs {
  font-size: 12px;
}

.text-muted-foreground {
  color: #94a3b8;
}
</style>
