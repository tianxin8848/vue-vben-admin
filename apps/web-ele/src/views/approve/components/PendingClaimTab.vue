<script lang="ts" setup>
import type { SearchForm } from '../constants';

import type { ClaimApi } from '#/api';

import { computed } from 'vue';

import { ElButton, ElTable, ElTableColumn, ElTag } from 'element-plus';

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

function viewDetail(row: any) {
  emit('viewDetail', row as ClaimApi.ClaimResponse);
}

function review(row: any) {
  emit('review', row as ClaimApi.ClaimResponse);
}

function withdraw(row: any) {
  emit('withdraw', row as ClaimApi.ClaimResponse);
}

const filtered = computed(() => {
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
});
</script>

<template>
  <div>
    <p class="tab-summary">
      共 {{ data.length }} 条待审批，当前筛选 {{ filtered.length }} 条
    </p>
    <ElTable
      :data="filtered"
      border
      stripe
      size="small"
      empty-text="暂无待审批报销"
    >
      <ElTableColumn prop="employee_name" label="申请人" width="100" />
      <ElTableColumn prop="employee_username" label="账号" width="120" />
      <ElTableColumn prop="employee_department" label="部门" width="140" />
      <ElTableColumn prop="employee_region" label="地区" width="100" />
      <ElTableColumn prop="reason_label" label="理由" width="120" />
      <ElTableColumn label="金额" width="160">
        <template #default="{ row }">
          <div>{{ row.amount.toFixed(2) }} {{ row.currency }}</div>
          <div v-if="row.amount_hkd" class="text-xs text-muted-foreground">
            ≈ HKD {{ row.amount_hkd.toFixed(2) }}
          </div>
        </template>
      </ElTableColumn>
      <ElTableColumn label="明细" width="80">
        <template #default="{ row }">
          {{ row.items?.length || 0 }} 条
        </template>
      </ElTableColumn>
      <ElTableColumn
        prop="description"
        label="描述"
        min-width="150"
        show-overflow-tooltip
      />
      <ElTableColumn prop="approval_status" label="状态" width="100">
        <template #default="{ row }">
          <ElTag :type="statusTypeMap[row.approval_status] || 'info'">
            {{ statusLabelMap[row.approval_status] || row.approval_status }}
          </ElTag>
        </template>
      </ElTableColumn>
      <ElTableColumn label="附件" width="100">
        <template #default="{ row }">
          <a
            v-if="row.attachment_url"
            :href="row.attachment_url"
            target="_blank"
          >
            {{ row.attachment_name || '查看' }}
          </a>
          <span v-else>-</span>
        </template>
      </ElTableColumn>
      <ElTableColumn label="操作" width="220" fixed="right">
        <template #default="{ row }">
          <ElButton size="small" @click="viewDetail(row)"> 详情 </ElButton>
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
