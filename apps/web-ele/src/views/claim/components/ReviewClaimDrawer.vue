<script lang="ts" setup>
import type { ClaimApi } from '#/api';

import { ref } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';

import { ElButton, ElMessage } from 'element-plus';

import { useVbenForm } from '#/adapter/form';
import { reviewClaimApi } from '#/api';

const emit = defineEmits<{
  success: [];
}>();

const currentReviewItem = ref<ClaimApi.ClaimResponse | null>(null);

const [ReviewForm, reviewFormApi] = useVbenForm({
  layout: 'vertical',
  showDefaultActions: false,
  schema: [
    {
      component: 'Input',
      fieldName: 'employee',
      label: '申请人',
      componentProps: { disabled: true },
    },
    {
      component: 'Input',
      fieldName: 'dept_region',
      label: '部门/地区',
      componentProps: { disabled: true },
    },
    {
      component: 'Input',
      fieldName: 'reason',
      label: '报销理由',
      componentProps: { disabled: true },
    },
    {
      component: 'Input',
      fieldName: 'amount_text',
      label: '金额',
      componentProps: { disabled: true },
    },
    {
      component: 'Input',
      fieldName: 'description',
      label: '说明',
      componentProps: { disabled: true, rows: 2, type: 'textarea' },
    },
    {
      component: 'Input',
      fieldName: 'attachment',
      label: '附件',
    },
    {
      component: 'Input',
      fieldName: 'review_comment',
      label: '审批备注',
      componentProps: {
        placeholder: '通过可不填；驳回必须填写原因',
        rows: 3,
        type: 'textarea',
      },
    },
  ],
});

const [ReviewDrawer, reviewDrawerApi] = useVbenDrawer({
  confirmText: '通过',
  onClosed() {
    reviewFormApi.resetForm();
    currentReviewItem.value = null;
  },
  onConfirm: () => submitReview('approved'),
  title: '审批报销申请',
});

async function open(item: ClaimApi.ClaimResponse) {
  currentReviewItem.value = item;
  await reviewFormApi.resetForm();
  await reviewFormApi.setValues({
    amount_text: `${item.amount.toFixed(2)} ${item.currency}${item.amount_hkd ? ` ≈ HKD ${item.amount_hkd.toFixed(2)}` : ''}`,
    dept_region: `${item.employee_department || '-'} / ${item.employee_region || '-'}`,
    description: item.description || '无',
    employee: `${item.employee_name}（${item.employee_username}）`,
    reason: item.reason_label,
    review_comment: '',
  });
  reviewDrawerApi.open();
}

async function submitReview(action: 'approved' | 'rejected') {
  const item = currentReviewItem.value;
  if (!item) return;
  const values = await reviewFormApi.getValues();
  const comment = (values.review_comment || '').trim();
  if (action === 'rejected' && !comment) {
    ElMessage.warning('驳回必须填写原因');
    return;
  }
  reviewDrawerApi.lock(true);
  try {
    await reviewClaimApi(item.id, {
      approval_status: action,
      review_comment: comment || null,
    });
    ElMessage.success(action === 'approved' ? '已通过' : '已驳回');
    reviewDrawerApi.close();
    emit('success');
  } catch {
    ElMessage.error('操作失败');
  } finally {
    reviewDrawerApi.lock(false);
  }
}

defineExpose({ open, submitReview });
</script>

<template>
  <ReviewDrawer class="w-[600px]">
    <ReviewForm>
      <template #attachment>
        <a
          v-if="currentReviewItem?.attachment_url"
          :href="currentReviewItem.attachment_url"
          target="_blank"
        >
          {{ currentReviewItem.attachment_name || '查看附件' }}
        </a>
        <span v-else>无</span>
      </template>
    </ReviewForm>
    <template #center-footer>
      <ElButton type="danger" @click="submitReview('rejected')">
        驳回
      </ElButton>
    </template>
  </ReviewDrawer>
</template>
