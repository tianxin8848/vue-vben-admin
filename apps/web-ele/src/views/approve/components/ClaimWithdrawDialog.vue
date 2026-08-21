<script lang="ts" setup>
import type { ClaimApi } from '#/api';

import { reactive, ref } from 'vue';

import {
  ElButton,
  ElDialog,
  ElForm,
  ElFormItem,
  ElInput,
  ElMessage,
} from 'element-plus';

import { withdrawClaimApi } from '#/api';

const props = defineProps<{
  current: ClaimApi.ClaimResponse | null;
  modelValue: boolean;
}>();

const emit = defineEmits<{
  confirmed: [];
  'update:modelValue': [value: boolean];
}>();

const form = reactive({ withdrawComment: '' });
const submitting = ref(false);

function reset() {
  form.withdrawComment = '';
}

async function submit() {
  if (!props.current) return;
  submitting.value = true;
  try {
    await withdrawClaimApi(
      props.current.id,
      form.withdrawComment.trim() || null,
    );
    ElMessage.success('已撤回');
    emit('update:modelValue', false);
    emit('confirmed');
    reset();
  } catch {
    ElMessage.error('撤回失败（需本人或拥有报销模块权限）');
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <ElDialog
    :model-value="modelValue"
    title="撤回报销"
    width="500px"
    @update:model-value="emit('update:modelValue', $event)"
    @closed="reset"
  >
    <div v-if="current" style="padding: 10px 0">
      <p>
        申请人：{{ current.employee_name }}（{{ current.employee_username }}）
      </p>
      <p>
        理由：{{ current.reason_label }} | {{ current.amount.toFixed(2) }}
        {{ current.currency }}
      </p>
      <ElForm :model="form" label-width="80px" style="margin-top: 16px">
        <ElFormItem label="撤回原因">
          <ElInput
            v-model="form.withdrawComment"
            type="textarea"
            :rows="4"
            placeholder="请输入撤回原因"
          />
        </ElFormItem>
      </ElForm>
    </div>
    <template #footer>
      <ElButton @click="emit('update:modelValue', false)">取消</ElButton>
      <ElButton type="danger" :loading="submitting" @click="submit">
        确认撤回
      </ElButton>
    </template>
  </ElDialog>
</template>
