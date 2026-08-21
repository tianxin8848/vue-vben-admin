<script lang="ts" setup>
import type { SearchForm } from '../constants';

import type { LeaveRequestApi } from '#/api';

import { computed } from 'vue';

import { ElButton, ElTable, ElTableColumn, ElTag } from 'element-plus';

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

function viewDetail(row: any) {
  emit('viewDetail', row as LeaveRequestApi.ApprovalRecord);
}

const filtered = computed(() => {
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
});
</script>

<template>
  <div>
    <p class="tab-summary">
      共 {{ data.length }} 条记录，当前筛选 {{ filtered.length }} 条
    </p>
    <ElTable
      :data="filtered"
      border
      stripe
      size="small"
      empty-text="暂无请假审批记录"
    >
      <ElTableColumn prop="employee_name" label="申请人" width="100" />
      <ElTableColumn prop="employee_username" label="账号" width="120" />
      <ElTableColumn prop="employee_code" label="工号" width="100" />
      <ElTableColumn prop="employee_department" label="部门" width="140" />
      <ElTableColumn prop="employee_region" label="地区" width="100" />
      <ElTableColumn prop="leave_type" label="类型" width="80">
        <template #default="{ row }">
          {{ leaveTypeLabelMap[row.leave_type] || row.leave_type }}
        </template>
      </ElTableColumn>
      <ElTableColumn label="时间范围" min-width="180">
        <template #default="{ row }">
          {{ row.start_date }} ~ {{ row.end_date }}
        </template>
      </ElTableColumn>
      <ElTableColumn label="我的操作" width="100">
        <template #default="{ row }">
          <ElTag :type="actionTypeMap[row.action] || 'info'">
            {{ actionLabelMap[row.action] || row.action }}
          </ElTag>
        </template>
      </ElTableColumn>
      <ElTableColumn label="当前状态" width="100">
        <template #default="{ row }">
          <ElTag :type="statusTypeMap[row.approval_status_after] || 'info'">
            {{
              statusLabelMap[row.approval_status_after] ||
              row.approval_status_after
            }}
          </ElTag>
        </template>
      </ElTableColumn>
      <ElTableColumn
        prop="comment"
        label="审批备注"
        min-width="150"
        show-overflow-tooltip
      />
      <ElTableColumn prop="created_at" label="处理时间" width="170">
        <template #default="{ row }">
          {{
            row.created_at
              ? new Date(row.created_at).toLocaleString('zh-CN')
              : '-'
          }}
        </template>
      </ElTableColumn>
      <ElTableColumn label="操作" width="100" fixed="right">
        <template #default="{ row }">
          <ElButton size="small" @click="viewDetail(row)"> 详情 </ElButton>
        </template>
      </ElTableColumn>
    </ElTable>
  </div>
</template>

<style scoped>
.tab-summary {
  margin: 0 0 12px;
  font-size: 14px;
  color: #64748b;
}
</style>
