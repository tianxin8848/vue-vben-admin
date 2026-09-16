<script lang="ts" setup>
import type { LeaveRequestApi } from '#/api';

import { reactive, ref } from 'vue';

import { ElButton, ElDialog, ElForm, ElFormItem, ElInput } from 'element-plus';

import { reviewLeaveRequestApi } from '#/api';
import { $t } from '#/locales';
import { handleActionError, toastSuccess, toastWarning } from '#/utils/message';

import { resolveLeaveTypeLabel, sessionLabelMap } from '../constants';

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
    toastWarning($t('page.approve.leaveReview.rejectRequired'));
    return;
  }
  submitting.value = true;
  try {
    await reviewLeaveRequestApi(props.current.id, {
      approval_status: action,
      review_comment: form.reviewComment.trim() || null,
    });
    toastSuccess(
      action === 'approved'
        ? $t('page.approve.leaveReview.approved')
        : $t('page.approve.leaveReview.rejected'),
    );
    emit('update:modelValue', false);
    emit('confirmed');
    reset();
  } catch (error) {
    handleActionError(
      'approve/LeaveReviewDialog',
      error,
      $t('page.approve.leaveReview.operateFailed'),
    );
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <ElDialog
    :model-value="modelValue"
    :title="$t('page.approve.leaveReview.title')"
    width="500px"
    @update:model-value="emit('update:modelValue', $event)"
    @closed="reset"
  >
    <div v-if="current" style="padding: 10px 0">
      <p>
        {{
          $t('page.approve.leaveReview.applicant', {
            name: current.employee_name,
            username: current.employee_username,
          })
        }}
      </p>
      <p>
        {{ $t('page.approve.leaveTypeLabel')
        }}{{ resolveLeaveTypeLabel(current.leave_type) }}
        |
        {{ $t(sessionLabelMap[current.session] || current.session) }}
      </p>
      <p>
        {{
          $t('page.approve.leaveReview.timeRange', {
            start: current.start_date,
            end: current.end_date,
          })
        }}
      </p>
      <ElForm :model="form" label-width="80px" style="margin-top: 16px">
        <ElFormItem :label="$t('page.approve.leaveReview.reviewComment')">
          <ElInput
            v-model="form.reviewComment"
            type="textarea"
            :rows="4"
            :placeholder="$t('page.approve.leaveReview.reviewPlaceholder')"
          />
        </ElFormItem>
      </ElForm>
    </div>
    <template #footer>
      <ElButton @click="emit('update:modelValue', false)">
        {{ $t('page.approve.leaveReview.cancel') }}
      </ElButton>
      <ElButton type="danger" :loading="submitting" @click="submit('rejected')">
        {{ $t('page.approve.leaveReview.reject') }}
      </ElButton>
      <ElButton
        type="primary"
        :loading="submitting"
        @click="submit('approved')"
      >
        {{ $t('page.approve.leaveReview.approve') }}
      </ElButton>
    </template>
  </ElDialog>
</template>
