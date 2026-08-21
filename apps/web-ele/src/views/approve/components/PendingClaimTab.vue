<script lang="ts" setup>
import type { SearchForm } from '../constants';

import type { ClaimApi } from '#/api';

import { watch } from 'vue';

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

const [BasicTable, tableApi] = useVbenVxeGrid<ClaimApi.ClaimResponse>({
  gridOptions: {
    id: 'approve-pending-claim',
    rowConfig: { keyField: 'id' },
    columns: [
      { field: 'employee_name', title: '申请人', width: 100 },
      { field: 'employee_username', title: '账号', width: 120 },
      { field: 'employee_department', title: '部门', width: 140 },
      { field: 'employee_region', title: '地区', width: 100 },
      { field: 'reason_label', title: '理由', width: 120 },
      {
        field: 'amount',
        title: '金额',
        width: 160,
        slots: { default: 'amount' },
      },
      {
        field: 'items',
        title: '明细',
        width: 80,
        slots: { default: 'items' },
      },
      { field: 'description', title: '描述', minWidth: 150 },
      {
        field: 'approval_status',
        title: '状态',
        width: 100,
        slots: { default: 'status' },
      },
      {
        field: 'attachment_url',
        title: '附件',
        width: 100,
        slots: { default: 'attachment' },
      },
      {
        title: '操作',
        width: 220,
        fixed: 'right',
        slots: { default: 'action' },
      },
    ],
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
  <BasicTable :table-title="`共 ${data.length} 条待审批`">
    <template #amount="{ row }">
      <div>{{ row.amount.toFixed(2) }} {{ row.currency }}</div>
      <div v-if="row.amount_hkd" class="text-xs text-muted-foreground">
        ≈ HKD {{ row.amount_hkd.toFixed(2) }}
      </div>
    </template>
    <template #items="{ row }"> {{ row.items?.length || 0 }} 条 </template>
    <template #status="{ row }">
      <ElTag :type="statusTypeMap[row.approval_status] || 'info'">
        {{ statusLabelMap[row.approval_status] || row.approval_status }}
      </ElTag>
    </template>
    <template #attachment="{ row }">
      <a v-if="row.attachment_url" :href="row.attachment_url" target="_blank">
        {{ row.attachment_name || '查看' }}
      </a>
      <span v-else>-</span>
    </template>
    <template #action="{ row }">
      <ElButton size="small" @click="viewDetail(row)">详情</ElButton>
      <ElButton
        v-if="row.approval_status === 'pending'"
        size="small"
        type="primary"
        @click="review(row)"
      >
        审批
      </ElButton>
      <ElButton
        v-if="row.approval_status === 'pending'"
        size="small"
        type="danger"
        @click="withdraw(row)"
      >
        撤回
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
