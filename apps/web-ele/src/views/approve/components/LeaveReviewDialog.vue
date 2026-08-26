<script lang="ts" setup>
import type { LeaveRequestApi } from '#/api';

import { reactive, ref } from 'vue';

import {
  ElButton,
  ElDialog,
  ElForm,
  ElFormItem,
  ElInput,
  ElMessage,
} from 'element-plus';

import { reviewLeaveRequestApi } from '#/api';
import { $t } from '#/locales';

import { leaveTypeLabelMap, sessionLabelMap } from '../constants';

const props = defineProps<{
  current: LeaveRequestApi.LeaveRequest | null;
  modelValue: boolean;
}>();

const emit = defineEmits<{
  confirmed: [];
  'update:modelValue': [value: boolean];
}>();

const form = reactive({ reviewComment: '' });
const submitting = ref(false);

function reset() {
  form.reviewComment = '';
}

async function submit(action: 'approved' | 'rejected') {
  if (!props.current) return;
  if (action === 'rejected' && !form.reviewComment.trim()) {
    ElMessage.warning('驳回必须填写原因');
    return;
  }
  submitting.value = true;
  try {
    await reviewLeaveRequestApi(props.current.id, {
      approval_status: action,
      review_comment: form.reviewComment.trim() || null,
    });
    ElMessage.success(action === 'approved' ? '已通过' : '已驳回');
    emit('update:modelValue', false);
    emit('confirmed');
    reset();
  } catch {
    ElMessage.error('操作失败');
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <ElDialog
    :model-value="modelValue"
    title="审批请假"
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
        }}{{
          $t(leaveTypeLabelMap[current.leave_type] || current.leave_type)
        }}
        |
        {{ $t(sessionLabelMap[current.session] || current.session) }}
      </p>
      <p>时间：{{ current.start_date }} ~ {{ current.end_date }}</p>
      <ElForm :model="form" label-width="80px" style="margin-top: 16px">
        <ElFormItem label="审批备注">
          <ElInput
            v-model="form.reviewComment"
            type="textarea"
            :rows="4"
            placeholder="通过可不填；驳回必须填写原因"
          />
        </ElFormItem>
      </ElForm>
    </div>
    <template #footer>
      <ElButton @click="emit('update:modelValue', false)">取消</ElButton>
      <ElButton type="danger" :loading="submitting" @click="submit('rejected')">
        驳回
      </ElButton>
      <ElButton
        type="primary"
        :loading="submitting"
        @click="submit('approved')"
      >
        通过
      </ElButton>
    </template>
  </ElDialog>
</template>
