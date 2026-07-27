<script lang="ts" setup>
import { ElForm, ElFormItem, ElInput } from 'element-plus';

defineProps<{
  modelValue: string;
}>();

defineEmits<{
  (e: 'update:modelValue', value: string): void;
}>();
</script>

<template>
  <div style="margin-top: 24px; padding-top: 24px; border-top: 1px solid #e2e8f0">
    <h3 style="margin: 0 0 12px; font-size: 18px">币种维护</h3>
    <p style="margin: 0 0 18px; color: #64748b">在这里维护报销页面可用币种，以及换算成港币时使用的汇率。</p>
    <ElForm label-width="160px">
      <ElFormItem label="币种列表">
        <ElInput
          :value="modelValue"
          type="textarea"
          :rows="3"
          placeholder="例如：&#10;CNY,1.09&#10;HKD,1.0&#10;USD,7.8&#10;MOP,0.97"
          @input="$emit('update:modelValue', $event)"
        />
      </ElFormItem>
    </ElForm>
    <p style="color: #64748b; font-size: 12px; margin-top: 8px">格式：`币种编码,换算港币汇率`，例如 `USD,7.8`。香港员工报销时会按这里的汇率自动折算港币。</p>
  </div>
</template>
