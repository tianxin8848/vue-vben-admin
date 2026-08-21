<script lang="ts" setup>
import type { SearchForm } from '../constants';

import type { LeaveRequestApi } from '#/api';

import { watch } from 'vue';

import { ElButton, ElTag } from 'element-plus';

import { useVbenVxeGrid } from '#/adapter/vxe-table';

import {
  leaveTypeLabelMap,
  sessionLabelMap,
  statusLabelMap,
  statusTypeMap,
} from '../constants';

const props = defineProps<{
  data: LeaveRequestApi.LeaveRequest[];
  searchForm: SearchForm;
}>();

const emit = defineEmits<{
  review: [row: LeaveRequestApi.LeaveRequest];
  viewDetail: [row: LeaveRequestApi.LeaveRequest];
  withdraw: [row: LeaveRequestApi.LeaveRequest];
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
      props.searchForm.leave_type &&
      row.leave_type !== props.searchForm.leave_type
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
      row.employee_code,
      row.employee_department,
      row.employee_region,
      row.reason,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return hay.includes(kw);
  });
}

const [BasicTable, tableApi] = useVbenVxeGrid<LeaveRequestApi.LeaveRequest>({
  gridOptions: {
    id: 'approve-pending-leave',
    rowConfig: { keyField: 'id' },
    columns: [
      { field: 'employee_name', title: '申请人', width: 100 },
      { field: 'employee_username', title: '账号', width: 120 },
      { field: 'employee_code', title: '工号', width: 100 },
      { field: 'employee_department', title: '部门', width: 140 },
      { field: 'employee_region', title: '地区', width: 100 },
      {
        field: 'leave_type',
        title: '类型',
        width: 80,
        slots: { default: 'leave_type' },
      },
      {
        field: 'session',
        title: '时段',
        width: 80,
        slots: { default: 'session' },
      },
      {
        title: '时间范围',
        minWidth: 180,
        slots: { default: 'time_range' },
      },
      { field: 'reason', title: '原因', minWidth: 150 },
      {
        field: 'approval_status',
        title: '状态',
        width: 100,
        slots: { default: 'status' },
      },
      {
        title: '操作',
        width: 200,
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
  emit('viewDetail', row as LeaveRequestApi.LeaveRequest);
}
function review(row: any) {
  emit('review', row as LeaveRequestApi.LeaveRequest);
}
function withdraw(row: any) {
  emit('withdraw', row as LeaveRequestApi.LeaveRequest);
}
</script>

<template>
  <BasicTable :table-title="`共 ${data.length} 条待审批`">
    <template #leave_type="{ row }">
      {{ leaveTypeLabelMap[row.leave_type] || row.leave_type }}
    </template>
    <template #session="{ row }">
      {{ sessionLabelMap[row.session] || row.session }}
    </template>
    <template #time_range="{ row }">
      {{ row.start_date }} ~ {{ row.end_date }}
    </template>
    <template #status="{ row }">
      <ElTag :type="statusTypeMap[row.approval_status] || 'info'">
        {{ statusLabelMap[row.approval_status] || row.approval_status }}
      </ElTag>
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
        v-if="
          row.approval_status === 'pending' ||
          row.approval_status === 'approved'
        "
        size="small"
        type="danger"
        @click="withdraw(row)"
      >
        撤回
      </ElButton>
    </template>
  </BasicTable>
</template>
