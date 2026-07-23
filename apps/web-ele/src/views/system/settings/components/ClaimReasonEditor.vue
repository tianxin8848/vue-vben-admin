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
    <h3 style="margin: 0 0 12px; font-size: 18px">报销理由维护</h3>
    <p style="margin: 0 0 18px; color: #64748b">在这里维护员工报销页面可勾选的报销理由，一行一个值。</p>
    <ElForm label-width="160px">
      <ElFormItem label="报销理由列表">
        <ElInput
          :value="modelValue"
          type="textarea"
          :rows="3"
          placeholder="例如：&#10;餐饮报销&#10;交通报销&#10;住宿报销&#10;其他报销"
          @input="$emit('update:modelValue', $event)"
        />
      </ElFormItem>
    </ElForm>
    <p style="color: #64748b; font-size: 12px; margin-top: 8px">保存系统参数后，员工报销页面的“报销理由”下拉会直接读取这里的配置。</p>
  </div>
</template>
