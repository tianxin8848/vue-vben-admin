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
    <h3 class="mb-3 text-lg">报销理由维护</h3>
    <p class="mb-4 text-sm text-muted-foreground">
      在这里维护员工报销页面可勾选的报销理由，一行一个值。
    </p>
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
    <p class="mt-2 text-xs text-muted-foreground">
      保存系统参数后，员工报销页面的“报销理由”下拉会直接读取这里的配置。
    </p>
  </section>
</template>
