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
  <section class="mt-6 border-t border-border pt-6">
    <h3 class="mb-3 text-lg">币种维护</h3>
    <p class="mb-4 text-sm text-muted-foreground">
      在这里维护报销页面可用币种，以及换算成港币时使用的汇率。
    </p>
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
    <p class="mt-2 text-xs text-muted-foreground">
      格式：`币种编码,换算港币汇率`，例如
      `USD,7.8`。香港员工报销时会按这里的汇率自动折算港币。
    </p>
  </section>
</template>
