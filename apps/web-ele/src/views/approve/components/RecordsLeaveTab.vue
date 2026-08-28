<script lang="ts" setup>
import type { SearchForm } from '../constants';

import type { VxeGridProps } from '#/adapter/vxe-table';
import type { LeaveRequestApi } from '#/api';

import { computed, watch } from 'vue';

import { useI18n } from '@vben/locales';

import { ElTag } from 'element-plus';

import { useVbenVxeGrid } from '#/adapter/vxe-table';

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

const { t } = useI18n();

function applyFilters() {
  const kw = props.searchForm.keyword.trim().toLowerCase();
  return props.data.filter((row) => {
    // pending 是提交快照或多级链流转中的中间态，不属于“已处理”，不进记录列表
    if (row.approval_status_after === 'pending') return false;
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

const tableColumns = computed<
  VxeGridProps<LeaveRequestApi.ApprovalRecord>['columns']
>(() => [
  {
    field: 'employee_name',
    title: t('page.approve.recordsLeaveTab.column.applicant'),
    width: 100,
  },
  {
    field: 'employee_username',
    title: t('page.approve.recordsLeaveTab.column.account'),
    width: 120,
  },
  {
    field: 'employee_code',
    title: t('page.approve.recordsLeaveTab.column.employeeCode'),
    width: 100,
  },
  {
    field: 'employee_department',
    title: t('page.approve.recordsLeaveTab.column.department'),
    width: 140,
  },
  {
    field: 'employee_region',
    title: t('page.approve.recordsLeaveTab.column.region'),
    width: 100,
  },
  {
    field: 'leave_type',
    title: t('page.approve.recordsLeaveTab.column.leaveType'),
    width: 80,
    slots: { default: 'leave_type' },
  },
  {
    title: t('page.approve.recordsLeaveTab.column.timeRange'),
    minWidth: 180,
    slots: { default: 'time_range' },
  },
  {
    field: 'action',
    title: t('page.approve.recordsLeaveTab.column.myAction'),
    width: 100,
    slots: { default: 'action' },
  },
  {
    field: 'approval_status_after',
    title: t('page.approve.recordsLeaveTab.column.currentStatus'),
    width: 100,
    slots: { default: 'status' },
  },
  {
    field: 'comment',
    title: t('page.approve.recordsLeaveTab.column.comment'),
    minWidth: 150,
  },
  {
    field: 'created_at',
    title: t('page.approve.recordsLeaveTab.column.processedAt'),
    width: 170,
    slots: { default: 'created_at' },
  },
]);

const [BasicTable, tableApi] = useVbenVxeGrid<LeaveRequestApi.ApprovalRecord>({
  gridOptions: {
    id: 'approve-records-leave',
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
      t('page.approve.recordsLeaveTab.listTitle', { count: data.length })
    "
  >
    <template #leave_type="{ row }">
      {{ t(leaveTypeLabelMap[row.leave_type] || row.leave_type) }}
    </template>
    <template #time_range="{ row }">
      {{ row.start_date }} ~ {{ row.end_date }}
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
