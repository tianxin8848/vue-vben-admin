<script lang="ts" setup>
import type { LeaveRequestApi } from '#/api';

import { computed, watch } from 'vue';

import { ElButton, ElTag } from 'element-plus';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { $t } from '#/locales';

import { leaveTypeLabelOverride } from '../../shared/leave-types';
import {
  createSessionOptions,
  createSharedToolbarConfig,
  createStatusOptions,
  createTableColumns,
  statusTagType,
} from '../data';

const props = defineProps<{
  /** 筛选后的请假记录 */
  records: LeaveRequestApi.LeaveRequest[];
}>();

const emit = defineEmits<{
  create: [];
  refresh: [];
  withdraw: [id: string];
}>();

/** 是否隐藏已撤回 / 已驳回记录 */
const hideWithdrawnOrRejected = defineModel<boolean>(
  'hideWithdrawnOrRejected',
  { required: true },
);

// 请假类型映射：直接用接口 system-settings.leave_types（code → 显示文本）
const leaveTypeOptions = leaveTypeLabelOverride;
const sessionOptions = computed(() => createSessionOptions($t));
const statusOptions = computed(() => createStatusOptions($t));
const tableColumns = computed(() => createTableColumns($t));
const sharedToolbarConfig = computed(() => createSharedToolbarConfig($t));

// 创建 BasicTable 实例
const [BasicTable, tableApi] = useVbenVxeGrid({
  gridOptions: {
    id: 'leave-list',
    rowConfig: { keyField: 'id' },
    columns: tableColumns.value,
    proxyConfig: { enabled: false },
    keepSource: true,
    toolbarConfig: sharedToolbarConfig.value,
  },
  gridEvents: {
    toolbarToolClick(event: { code: string }) {
      if (event.code === 'manual-refresh') emit('refresh');
    },
  },
});

// 刷新表格
function refreshTable() {
  tableApi.setGridOptions({
    data: props.records,
  });
}

// 监听语言切换，更新表格列
watch([tableColumns, sharedToolbarConfig], () => {
  tableApi.setGridOptions({
    columns: tableColumns.value,
    toolbarConfig: sharedToolbarConfig.value,
  });
  refreshTable();
});

// 监听数据变化刷新表格
watch(
  () => props.records,
  () => {
    refreshTable();
  },
);
</script>

<template>
  <BasicTable
    :table-title="
      $t('page.leave.employeeLeave.listTitle', {
        count: records.length,
      })
    "
  >
    <template #toolbar-tools>
      <ElButton type="primary" @click="emit('create')">
        {{ $t('page.leave.employeeLeave.button.create') }}
      </ElButton>
      <ElButton @click="hideWithdrawnOrRejected = !hideWithdrawnOrRejected">
        {{
          hideWithdrawnOrRejected
            ? $t('page.leave.employeeLeave.button.showAll')
            : $t('page.leave.employeeLeave.button.hideWithdrawnRejected')
        }}
      </ElButton>
    </template>

    <template #date_range="{ row }">
      {{
        row.start_date === row.end_date
          ? row.start_date
          : `${row.start_date} ${$t('page.leave.employeeLeave.date.to')} ${row.end_date}`
      }}
    </template>

    <template #leave_type="{ row }">
      <ElTag type="info">{{ leaveTypeOptions[row.leave_type] }}</ElTag>
    </template>

    <template #session="{ row }">
      <ElTag>{{ sessionOptions[row.session] }}</ElTag>
    </template>

    <template #status="{ row }">
      <ElTag :type="statusTagType(row.approval_status)">
        {{ statusOptions[row.approval_status] }}
      </ElTag>
    </template>

    <template #created_at="{ row }">
      {{
        row.created_at ? new Date(row.created_at).toLocaleString('zh-CN') : '-'
      }}
    </template>

    <template #action="{ row }">
      <ElButton
        v-if="row.approval_status === 'pending'"
        size="small"
        type="danger"
        @click="emit('withdraw', row.id)"
      >
        {{ $t('page.leave.employeeLeave.button.withdraw') }}
      </ElButton>
      <span v-else style="color: hsl(var(--muted-foreground))">-</span>
    </template>
  </BasicTable>
</template>
