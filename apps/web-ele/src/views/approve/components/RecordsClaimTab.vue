<script lang="ts" setup>
import type { SearchForm } from '../constants';

import type { ClaimApi } from '#/api';

import { computed } from 'vue';

import { ElButton, ElTable, ElTableColumn, ElTag } from 'element-plus';

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

function viewDetail(row: any) {
  emit('viewDetail', row as ClaimApi.ClaimApprovalRecord);
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
      empty-text="暂无报销审批记录"
    >
      <ElTableColumn prop="employee_name" label="申请人" width="100" />
      <ElTableColumn prop="employee_username" label="账号" width="120" />
      <ElTableColumn prop="employee_department" label="部门" width="140" />
      <ElTableColumn prop="employee_region" label="地区" width="100" />
      <ElTableColumn prop="claim_reason_label" label="理由" width="120" />
      <ElTableColumn label="金额" width="160">
        <template #default="{ row }">
          <div>{{ row.amount.toFixed(2) }} {{ row.currency }}</div>
          <div v-if="row.amount_hkd" class="text-xs text-muted-foreground">
            ≈ HKD {{ row.amount_hkd.toFixed(2) }}
          </div>
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

.text-xs {
  font-size: 12px;
}

.text-muted-foreground {
  color: #94a3b8;
}
</style>
