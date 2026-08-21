<script lang="ts" setup>
import type { LeaveRequestApi } from '#/api';

import { ElButton, ElDialog, ElTag } from 'element-plus';

import {
  leaveTypeLabelMap,
  sessionLabelMap,
  statusLabelMap,
  statusTypeMap,
} from '../constants';

defineProps<{
  current: LeaveRequestApi.LeaveRequest | null;
  modelValue: boolean;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
}>();

function close() {
  emit('update:modelValue', false);
}
</script>

<template>
  <ElDialog
    :model-value="modelValue"
    title="请假详情"
    width="600px"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div v-if="current" style="padding: 10px 0">
      <div class="info-grid">
        <div class="info-item">
          <span class="info-label">申请人：</span>
          <strong>{{ current.employee_name }}</strong>（{{ current.employee_username }}）
        </div>
        <div class="info-item">
          <span class="info-label">工号：</span>
          {{ current.employee_code || '-' }}
        </div>
        <div class="info-item">
          <span class="info-label">部门/地区：</span>
          {{ current.employee_department || '-' }} /
          {{ current.employee_region || '-' }}
        </div>
        <div class="info-item">
          <span class="info-label">请假类型：</span>
          {{ leaveTypeLabelMap[current.leave_type] || current.leave_type }}
        </div>
        <div class="info-item">
          <span class="info-label">时段：</span>
          {{ sessionLabelMap[current.session] || current.session }}
        </div>
        <div class="info-item">
          <span class="info-label">时间范围：</span>
          {{ current.start_date }} ~ {{ current.end_date }}
        </div>
        <div class="info-item">
          <span class="info-label">原因：</span>
          {{ current.reason || '无' }}
        </div>
        <div class="info-item">
          <span class="info-label">交接人：</span>
          {{ current.handover_to || '无' }}
        </div>
        <div class="info-item">
          <span class="info-label">状态：</span>
          <ElTag :type="statusTypeMap[current.approval_status] || 'info'">
            {{
              statusLabelMap[current.approval_status] || current.approval_status
            }}
          </ElTag>
        </div>
        <div class="info-item">
          <span class="info-label">审批意见：</span>
          {{ current.review_comment || '无' }}
        </div>
      </div>
    </div>
    <template #footer>
      <ElButton @click="close">关闭</ElButton>
    </template>
  </ElDialog>
</template>

<style scoped>
.info-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px 20px;
}

.info-item {
  font-size: 14px;
  line-height: 1.6;
}

.info-label {
  color: #64748b;
}
</style>
