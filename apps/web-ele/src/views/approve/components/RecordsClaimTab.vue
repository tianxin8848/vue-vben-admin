<script lang="ts" setup>
import type { SearchForm } from '../constants';

import type { ClaimApi } from '#/api';

import { watch } from 'vue';

import { ElButton, ElTag } from 'element-plus';

import { useVbenVxeGrid } from '#/adapter/vxe-table';

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

const emit = defineEmits<{
  viewDetail: [row: ClaimApi.ClaimApprovalRecord];
}>();

function applyFilters() {
  const kw = props.searchForm.keyword.trim().toLowerCase();
  return props.data.filter((row) => {
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

const [BasicTable, tableApi] = useVbenVxeGrid({
  gridOptions: {
    id: 'approve-records-claim',
    rowConfig: { keyField: 'claim_request_id' },
    columns: [
      { field: 'employee_name', title: '申请人', width: 100 },
      { field: 'employee_username', title: '账号', width: 120 },
      { field: 'employee_department', title: '部门', width: 140 },
      { field: 'employee_region', title: '地区', width: 100 },
      { field: 'claim_reason_label', title: '理由', width: 120 },
      {
        field: 'amount',
        title: '金额',
        width: 160,
        slots: { default: 'amount' },
      },
      {
        field: 'action',
        title: '我的操作',
        width: 100,
        slots: { default: 'action' },
      },
      {
        field: 'approval_status_after',
        title: '当前状态',
        width: 100,
        slots: { default: 'status' },
      },
      { field: 'comment', title: '审批备注', minWidth: 150 },
      {
        field: 'created_at',
        title: '处理时间',
        width: 170,
        slots: { default: 'created_at' },
      },
      {
        title: '操作',
        width: 100,
        fixed: 'right',
        slots: { default: 'view_action' },
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
    toolbarConfig: { custom: true, zoom: true },
    height: 'auto',
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
  emit('viewDetail', row as ClaimApi.ClaimApprovalRecord);
}
</script>

<template>
  <BasicTable :table-title="`共 ${data.length} 条记录`">
    <template #amount="{ row }">
      <div>{{ row.amount.toFixed(2) }} {{ row.currency }}</div>
      <div v-if="row.amount_hkd" class="text-xs text-muted-foreground">
        ≈ HKD {{ row.amount_hkd.toFixed(2) }}
      </div>
    </template>
    <template #action="{ row }">
      <ElTag :type="actionTypeMap[row.action] || 'info'">
        {{ actionLabelMap[row.action] || row.action }}
      </ElTag>
    </template>
    <template #status="{ row }">
      <ElTag :type="statusTypeMap[row.approval_status_after] || 'info'">
        {{
          statusLabelMap[row.approval_status_after] || row.approval_status_after
        }}
      </ElTag>
    </template>
    <template #created_at="{ row }">
      {{
        row.created_at ? new Date(row.created_at).toLocaleString('zh-CN') : '-'
      }}
    </template>
    <template #view_action="{ row }">
      <ElButton size="small" @click="viewDetail(row)">详情</ElButton>
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
