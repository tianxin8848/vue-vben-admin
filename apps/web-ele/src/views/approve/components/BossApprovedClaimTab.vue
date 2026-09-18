<script lang="ts" setup>
import type { SearchForm } from '../constants';

import type { VxeGridProps } from '#/adapter/vxe-table';
import type { ClaimApi } from '#/api';

import { computed, watch } from 'vue';

import { useI18n } from '@vben/locales';

import { ElButton, ElTag } from 'element-plus';

import { useVbenVxeGrid } from '#/adapter/vxe-table';

import { statusLabelMap, statusTypeMap } from '../constants';

/**
 * 老闆（岗位 = 老闆）只读查看全部员工已通过报销。
 * 数据来自 GET /me/claims/approved（非老闆返回空数组）。
 * 本组件不含审批/驳回/撤回入口 —— 审批仍仅限当前审批人。
 */
const props = defineProps<{
  data: ClaimApi.ClaimResponse[];
  searchForm: SearchForm;
}>();

const emit = defineEmits<{
  viewDetail: [row: ClaimApi.ClaimResponse];
}>();

const { t } = useI18n();

function applyFilters() {
  const kw = props.searchForm.keyword.trim().toLowerCase();
  return props.data.filter((row) => {
    if (
      props.searchForm.status &&
      row.approval_status !== props.searchForm.status
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
      row.reason_label,
      row.description,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return hay.includes(kw);
  });
}

const tableColumns = computed<VxeGridProps<ClaimApi.ClaimResponse>['columns']>(
  () => [
    {
      field: 'employee_name',
      title: t('page.approve.bossApprovedTab.column.applicant'),
      width: 170,
      slots: { default: 'applicant' },
    },
    {
      field: 'reason_label',
      title: t('page.approve.bossApprovedTab.column.reason'),
      width: 120,
    },
    {
      field: 'amount',
      title: t('page.approve.bossApprovedTab.column.amount'),
      width: 160,
      slots: { default: 'amount' },
    },
    {
      field: 'employee_department',
      title: t('page.approve.bossApprovedTab.column.deptRegion'),
      width: 150,
      slots: { default: 'deptRegion' },
    },
    {
      field: 'approval_status',
      title: t('page.approve.bossApprovedTab.column.status'),
      width: 100,
      slots: { default: 'status' },
    },
    {
      field: 'created_at',
      title: t('page.approve.bossApprovedTab.column.submittedAt'),
      minWidth: 170,
      slots: { default: 'created_at' },
    },
    {
      field: 'action',
      title: t('page.approve.bossApprovedTab.column.action'),
      width: 90,
      slots: { default: 'action' },
    },
  ],
);

const [BasicTable, tableApi] = useVbenVxeGrid<ClaimApi.ClaimResponse>({
  gridOptions: {
    id: 'approve-boss-approved-claim',
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
      t('page.approve.bossApprovedTab.listTitle', { count: data.length })
    "
  >
    <template #applicant="{ row }">
      <strong>{{ row.employee_name }}</strong>
      <div class="text-xs text-muted-foreground">
        {{ row.employee_username }}
      </div>
    </template>
    <template #amount="{ row }">
      <div>{{ row.amount.toFixed(2) }} {{ row.currency }}</div>
      <div v-if="row.amount_hkd" class="text-xs text-muted-foreground">
        ≈ HKD {{ row.amount_hkd.toFixed(2) }}
      </div>
    </template>
    <template #deptRegion="{ row }">
      {{ row.employee_department || '-' }} / {{ row.employee_region || '-' }}
    </template>
    <template #status="{ row }">
      <ElTag :type="statusTypeMap[row.approval_status] || 'info'">
        {{ t(statusLabelMap[row.approval_status] || row.approval_status) }}
      </ElTag>
    </template>
    <template #created_at="{ row }">
      {{
        row.created_at ? new Date(row.created_at).toLocaleString('zh-CN') : '-'
      }}
    </template>
    <template #action="{ row }">
      <ElButton link type="primary" @click="emit('viewDetail', row)">
        {{ t('page.approve.bossApprovedTab.view') }}
      </ElButton>
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
