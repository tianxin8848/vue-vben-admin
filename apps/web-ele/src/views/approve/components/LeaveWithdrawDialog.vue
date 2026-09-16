<script lang="ts" setup>
import type { LeaveRequestApi } from '#/api';

import { reactive, ref } from 'vue';

import { ElButton, ElDialog, ElForm, ElFormItem, ElInput } from 'element-plus';

import { withdrawLeaveRequestApi } from '#/api';
import { $t } from '#/locales';
import { handleActionError, toastSuccess } from '#/utils/message';

import { resolveLeaveTypeLabel, sessionLabelMap } from '../constants';

const props = defineProps<{
  current: LeaveRequestApi.LeaveRequest | null;
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
    await withdrawLeaveRequestApi(props.current.id, {
      withdraw_comment: form.withdrawComment.trim() || null,
    });
    toastSuccess('已撤回');
    emit('update:modelValue', false);
    emit('confirmed');
    reset();
  } catch (error) {
    handleActionError(
      'approve/LeaveWithdrawDialog',
      error,
      '撤回失败（需本人或拥有请假模块权限）',
    );
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <ElDialog
    :model-value="modelValue"
    title="撤回请假"
    width="500px"
    @update:model-value="emit('update:modelValue', $event)"
    @closed="reset"
  >
    <div v-if="current" style="padding: 10px 0">
      <p>
        申请人：{{ current.employee_name }}（{{ current.employee_username }}）
      </p>
      <p>
        {{ $t('page.approve.leaveTypeLabel')
        }}{{ resolveLeaveTypeLabel(current.leave_type) }}
        |
        {{ $t(sessionLabelMap[current.session] || current.session) }}
      </p>
      <p>时间：{{ current.start_date }} ~ {{ current.end_date }}</p>
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
