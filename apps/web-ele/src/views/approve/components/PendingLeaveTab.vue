<script lang="ts" setup>
import type { SearchForm } from '../constants';

import type { VxeGridProps } from '#/adapter/vxe-table';
import type { LeaveRequestApi } from '#/api';

import { computed, watch } from 'vue';

import { useI18n } from '@vben/locales';

import { ElButton, ElTag } from 'element-plus';

import { useVbenVxeGrid } from '#/adapter/vxe-table';

import {
  resolveLeaveTypeLabel,
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

const tableColumns = computed<
  VxeGridProps<LeaveRequestApi.LeaveRequest>['columns']
>(() => [
  {
    field: 'employee_username',
    title: t('page.approve.pendingLeaveTab.column.account'),
    width: 120,
  },
  {
    field: 'leave_type',
    title: t('page.approve.pendingLeaveTab.column.leaveType'),
    width: 80,
    slots: { default: 'leave_type' },
  },
  {
    field: 'session',
    title: t('page.approve.pendingLeaveTab.column.session'),
    width: 80,
    slots: { default: 'session' },
  },
  {
    title: t('page.approve.pendingLeaveTab.column.timeRange'),
    minWidth: 180,
    slots: { default: 'time_range' },
  },
  {
    field: 'total_days',
    title: t('page.approve.pendingLeaveTab.column.totalDays'),
    width: 80,
  },
  {
    field: 'reason',
    title: t('page.approve.pendingLeaveTab.column.reason'),
    minWidth: 150,
  },
  {
    field: 'approval_status',
    title: t('page.approve.pendingLeaveTab.column.status'),
    width: 100,
    slots: { default: 'status' },
  },
  {
    title: t('page.approve.pendingLeaveTab.column.action'),
    width: 200,
    fixed: 'right',
    slots: { default: 'action' },
  },
]);

const [BasicTable, tableApi] = useVbenVxeGrid<LeaveRequestApi.LeaveRequest>({
  gridOptions: {
    id: 'approve-pending-leave',
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
  <BasicTable
    :table-title="
      t('page.approve.pendingLeaveTab.listTitle', { count: data.length })
    "
  >
    <template #leave_type="{ row }">
      {{ resolveLeaveTypeLabel(row.leave_type) }}
    </template>
    <template #session="{ row }">
      {{ t(sessionLabelMap[row.session] || row.session) }}
    </template>
    <template #time_range="{ row }">
      {{ row.start_date }} ~ {{ row.end_date }}
    </template>
    <template #status="{ row }">
      <ElTag :type="statusTypeMap[row.approval_status] || 'info'">
        {{ t(statusLabelMap[row.approval_status] || row.approval_status) }}
      </ElTag>
    </template>
    <template #action="{ row }">
      <ElButton size="small" @click="viewDetail(row)">
        {{ t('page.approve.pendingLeaveTab.viewDetail') }}
      </ElButton>
      <ElButton
        v-if="row.approval_status === 'pending'"
        size="small"
        type="primary"
        @click="review(row)"
      >
        {{ t('page.approve.pendingLeaveTab.review') }}
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
        {{ t('page.approve.pendingLeaveTab.withdraw') }}
      </ElButton>
    </template>
  </BasicTable>
</template>
