<script lang="ts" setup>
import type { SearchForm } from '../constants';

import type { VxeGridProps } from '#/adapter/vxe-table';
import type { ClaimApi } from '#/api';

import { computed, watch } from 'vue';

import { useI18n } from '@vben/locales';

import { ElButton, ElTag } from 'element-plus';

import { useVbenVxeGrid } from '#/adapter/vxe-table';

import { statusLabelMap, statusTypeMap } from '../constants';

const props = defineProps<{
  data: ClaimApi.ClaimResponse[];
  searchForm: SearchForm;
}>();

const emit = defineEmits<{
  review: [row: ClaimApi.ClaimResponse];
  viewDetail: [row: ClaimApi.ClaimResponse];
  withdraw: [row: ClaimApi.ClaimResponse];
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
      title: t('page.approve.pendingClaimTab.column.applicant'),
      width: 100,
    },
    {
      field: 'employee_username',
      title: t('page.approve.pendingClaimTab.column.account'),
      width: 120,
    },
    {
      field: 'employee_department',
      title: t('page.approve.pendingClaimTab.column.department'),
      width: 140,
    },
    {
      field: 'employee_region',
      title: t('page.approve.pendingClaimTab.column.region'),
      width: 100,
    },
    {
      field: 'reason_label',
      title: t('page.approve.pendingClaimTab.column.reason'),
      width: 120,
    },
    {
      field: 'amount',
      title: t('page.approve.pendingClaimTab.column.amount'),
      width: 160,
      slots: { default: 'amount' },
    },
    {
      field: 'items',
      title: t('page.approve.pendingClaimTab.column.items'),
      width: 80,
      slots: { default: 'items' },
    },
    {
      field: 'description',
      title: t('page.approve.pendingClaimTab.column.description'),
      minWidth: 150,
    },
    {
      field: 'approval_status',
      title: t('page.approve.pendingClaimTab.column.status'),
      width: 100,
      slots: { default: 'status' },
    },
    {
      field: 'attachment_url',
      title: t('page.approve.pendingClaimTab.column.attachment'),
      width: 100,
      slots: { default: 'attachment' },
    },
    {
      title: t('page.approve.pendingClaimTab.column.action'),
      width: 220,
      fixed: 'right',
      slots: { default: 'action' },
    },
  ],
);

const [BasicTable, tableApi] = useVbenVxeGrid<ClaimApi.ClaimResponse>({
  gridOptions: {
    id: 'approve-pending-claim',
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

function viewDetail(row: any) {
  emit('viewDetail', row as ClaimApi.ClaimResponse);
}
function review(row: any) {
  emit('review', row as ClaimApi.ClaimResponse);
}
function withdraw(row: any) {
  emit('withdraw', row as ClaimApi.ClaimResponse);
}
</script>

<template>
  <BasicTable
    :table-title="
      t('page.approve.pendingClaimTab.listTitle', { count: data.length })
    "
  >
    <template #amount="{ row }">
      <div>{{ row.amount.toFixed(2) }} {{ row.currency }}</div>
      <div v-if="row.amount_hkd" class="text-xs text-muted-foreground">
        ≈ HKD {{ row.amount_hkd.toFixed(2) }}
      </div>
    </template>
    <template #items="{ row }">
      {{
        t('page.approve.pendingClaimTab.itemsCount', {
          count: row.items?.length || 0,
        })
      }}
    </template>
    <template #status="{ row }">
      <ElTag :type="statusTypeMap[row.approval_status] || 'info'">
        {{ statusLabelMap[row.approval_status] || row.approval_status }}
      </ElTag>
    </template>
    <template #attachment="{ row }">
      <a v-if="row.attachment_url" :href="row.attachment_url" target="_blank">
        {{ row.attachment_name || t('page.approve.pendingClaimTab.view') }}
      </a>
      <span v-else>-</span>
    </template>
    <template #action="{ row }">
      <ElButton size="small" @click="viewDetail(row)">
        {{ t('page.approve.pendingClaimTab.detail') }}
      </ElButton>
      <ElButton
        v-if="row.approval_status === 'pending'"
        size="small"
        type="primary"
        @click="review(row)"
      >
        {{ t('page.approve.pendingClaimTab.review') }}
      </ElButton>
      <ElButton
        v-if="row.approval_status === 'pending'"
        size="small"
        type="danger"
        @click="withdraw(row)"
      >
        {{ t('page.approve.pendingClaimTab.withdraw') }}
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
