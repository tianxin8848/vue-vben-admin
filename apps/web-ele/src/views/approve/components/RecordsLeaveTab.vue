<script lang="ts" setup>
import type { SearchForm } from '../constants';

import type { LeaveRequestApi } from '#/api';

import { watch } from 'vue';

import { ElButton, ElTag } from 'element-plus';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { $t } from '#/locales';

import {
  actionLabelMap,
  actionTypeMap,
  leaveTypeLabelMap,
  statusLabelMap,
  statusTypeMap,
} from '../constants';

const props = defineProps<{
  data: LeaveRequestApi.ApprovalRecord[];
  searchForm: SearchForm;
}>();

const emit = defineEmits<{
  viewDetail: [row: LeaveRequestApi.ApprovalRecord];
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
      row.comment,
      row.operator_name,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return hay.includes(kw);
  });
}

const [BasicTable, tableApi] = useVbenVxeGrid<LeaveRequestApi.ApprovalRecord>({
  gridOptions: {
    id: 'approve-records-leave',
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
        title: '时间范围',
        minWidth: 180,
        slots: { default: 'time_range' },
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
  emit('viewDetail', row as LeaveRequestApi.ApprovalRecord);
}
</script>

<template>
  <BasicTable :table-title="`共 ${data.length} 条记录`">
    <template #leave_type="{ row }">
      {{ $t(leaveTypeLabelMap[row.leave_type] || row.leave_type) }}
    </template>
    <template #time_range="{ row }">
      {{ row.start_date }} ~ {{ row.end_date }}
    </template>
    <template #action="{ row }">
      <ElTag :type="actionTypeMap[row.action] || 'info'">
        {{ $t(actionLabelMap[row.action] || row.action) }}
      </ElTag>
    </template>
    <template #status="{ row }">
      <ElTag :type="statusTypeMap[row.approval_status_after] || 'info'">
        {{
          $t(
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
    <template #view_action="{ row }">
      <ElButton size="small" @click="viewDetail(row)">详情</ElButton>
    </template>
  </BasicTable>
</template>
