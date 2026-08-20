<script lang="ts" setup>
import type { EmployeeApi } from '#/api';

import { computed, ref, watch } from 'vue';

import { ElButton, ElDialog, ElInput, ElMessage } from 'element-plus';

const props = defineProps<{
  employee: EmployeeApi.EmployeeResponse | null;
  loading?: boolean;
}>();

const emit = defineEmits<{
  submit: [payload: EmployeeApi.EmployeeAccessControlUpdate];
}>();

const visible = defineModel<boolean>('visible', { default: false });

const accessControlId = ref('');

const employeeLabel = computed(() => {
  if (!props.employee) return '';
  const { full_name, username, employee_code } = props.employee;
  return [full_name || username, employee_code ? `(${employee_code})` : '']
    .filter(Boolean)
    .join(' ');
});

function syncForm() {
  accessControlId.value = props.employee?.access_control_id ?? '';
}

watch(
  () => [props.employee, visible.value] as const,
  () => {
    if (visible.value) syncForm();
  },
  { deep: true, immediate: true },
);

function handleSubmit() {
  if (!accessControlId.value.trim()) {
    ElMessage.warning('门禁 ID 不能为空（如需清空请到门禁模块处理）');
    return;
  }
  emit('submit', { access_control_id: accessControlId.value.trim() });
}

function handleClose() {
  visible.value = false;
}
</script>

<template>
  <ElDialog
    v-model="visible"
    :title="`编辑门禁 ID - ${employeeLabel}`"
    width="420px"
    destroy-on-close
  >
    <ElInput
      v-model="accessControlId"
      placeholder="请输入门禁 ID"
      clearable
      maxlength="64"
      show-word-limit
    />
    <p class="mt-2 text-xs text-muted-foreground">
      门禁 ID 用于员工刷卡进出，请确保与门禁系统登记一致。
    </p>

    <template #footer>
      <ElButton :loading="loading" @click="handleClose">取消</ElButton>
      <ElButton :loading="loading" type="primary" @click="handleSubmit">
        保存
      </ElButton>
    </template>
  </ElDialog>
</template>
