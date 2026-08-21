<script lang="ts" setup>
import type { ClaimApi } from '#/api';

import { ElButton, ElDialog, ElTag } from 'element-plus';

import { statusLabelMap, statusTypeMap } from '../constants';

defineProps<{
  current: ClaimApi.ClaimResponse | null;
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
    title="报销详情"
    width="680px"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div v-if="current" style="padding: 10px 0">
      <div class="info-grid">
        <div class="info-item">
          <span class="info-label">申请人：</span>
          <strong>{{ current.employee_name }}</strong>（{{ current.employee_username }}）
        </div>
        <div class="info-item">
          <span class="info-label">部门/地区：</span>
          {{ current.employee_department || '-' }} /
          {{ current.employee_region || '-' }}
        </div>
        <div class="info-item">
          <span class="info-label">理由：</span>
          {{ current.reason_label }}
        </div>
        <div class="info-item">
          <span class="info-label">金额：</span>
          {{ current.amount.toFixed(2) }} {{ current.currency }}
          <span v-if="current.amount_hkd" class="text-xs text-muted-foreground">
            ≈ HKD {{ current.amount_hkd.toFixed(2) }}
          </span>
        </div>
        <div class="info-item">
          <span class="info-label">开票日期：</span>
          {{ current.invoice_date || '-' }}
        </div>
        <div class="info-item">
          <span class="info-label">票号：</span>
          {{ current.invoice_no || '-' }}
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
          <span class="info-label">附件：</span>
          <a
            v-if="current.attachment_url"
            :href="current.attachment_url"
            target="_blank"
          >
            {{ current.attachment_name || '查看附件' }}
          </a>
          <span v-else>无</span>
        </div>
        <div class="info-item info-item--full">
          <span class="info-label">描述：</span>
          {{ current.description || '无' }}
        </div>
        <div class="info-item info-item--full">
          <span class="info-label">审批意见：</span>
          {{ current.review_comment || '无' }}
        </div>
      </div>

      <div
        v-if="current.items && current.items.length > 0"
        class="items-section"
      >
        <div class="items-title">明细项（{{ current.items.length }} 条）</div>
        <div
          v-for="(it, idx) in current.items"
          :key="it.item_id ?? idx"
          class="item-row"
        >
          <div>
            <strong>{{ it.reason_label }}</strong>
            <span class="ml-2">
              {{ it.amount.toFixed(2) }} {{ it.currency }}
              <span v-if="it.amount_hkd" class="text-xs text-muted-foreground">
                ≈ HKD {{ it.amount_hkd.toFixed(2) }}
              </span>
            </span>
          </div>
          <div
            v-if="it.description || it.invoice_date || it.invoice_no"
            class="ml-2 text-xs text-muted-foreground"
          >
            <div v-if="it.description">{{ it.description }}</div>
            <div v-if="it.invoice_date || it.invoice_no" class="mt-0-5">
              <span v-if="it.invoice_date">
                开票日期: {{ it.invoice_date }}
              </span>
              <span v-if="it.invoice_no" class="ml-2">
                票号: {{ it.invoice_no }}
              </span>
            </div>
          </div>
          <div class="ml-2">
            <a
              v-if="it.attachment_url"
              :href="it.attachment_url"
              target="_blank"
              class="text-xs"
            >
              {{ it.attachment_name || '查看附件' }}
            </a>
          </div>
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

.info-item--full {
  grid-column: 1 / -1;
}

.info-label {
  color: #64748b;
}

.items-section {
  padding-top: 12px;
  margin-top: 16px;
  border-top: 1px solid #e5e7eb;
}

.items-title {
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
}

.item-row {
  padding: 8px;
  margin-bottom: 8px;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
}

.text-xs {
  font-size: 12px;
}

.text-muted-foreground {
  color: #94a3b8;
}

.ml-2 {
  margin-left: 8px;
}

.mt-0-5 {
  margin-top: 2px;
}
</style>
