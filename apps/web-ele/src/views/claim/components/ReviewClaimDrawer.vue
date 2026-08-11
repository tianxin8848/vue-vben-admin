<script lang="ts" setup>
import type { ClaimApi } from '#/api';

import { computed, reactive, ref } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';
import { useI18n } from '@vben/locales';

import { ElButton, ElMessage } from 'element-plus';

import { useVbenForm } from '#/adapter/form';
import { reviewClaimApi } from '#/api';

const emit = defineEmits<{
  success: [];
}>();

const { t } = useI18n();

const currentReviewItem = ref<ClaimApi.ClaimResponse | null>(null);

const [ReviewForm, reviewFormApi] = useVbenForm(
  reactive({
    layout: 'vertical',
    showDefaultActions: false,
    schema: computed(() => [
      {
        component: 'Input',
        fieldName: 'employee',
        label: t('page.claim.form.employeeLabel'),
        componentProps: { disabled: true },
      },
      {
        component: 'Input',
        fieldName: 'dept_region',
        label: t('page.claim.columns.deptRegion'),
        componentProps: { disabled: true },
      },
      {
        component: 'Input',
        fieldName: 'reason',
        label: t('page.claim.form.reasonLabel'),
        componentProps: { disabled: true },
      },
      {
        component: 'Input',
        fieldName: 'invoice_date',
        label: t('page.claim.form.invoiceDateLabel'),
        componentProps: { disabled: true },
      },
      {
        component: 'Input',
        fieldName: 'invoice_no',
        label: t('page.claim.form.invoiceNoLabel'),
        componentProps: { disabled: true },
      },
      {
        component: 'Input',
        fieldName: 'amount_text',
        label: t('page.claim.form.amountLabel'),
        componentProps: { disabled: true },
      },
      {
        component: 'Input',
        fieldName: 'description',
        label: t('page.claim.form.descriptionLabel'),
        componentProps: { disabled: true, rows: 2, type: 'textarea' },
      },
      {
        component: 'Input',
        fieldName: 'attachment',
        label: t('page.claim.form.attachmentLabel'),
      },
      {
        component: 'Input',
        fieldName: 'review_comment',
        label: t('page.claim.form.reviewCommentLabel'),
        componentProps: {
          placeholder: t('page.claim.form.reviewCommentPlaceholder'),
          rows: 3,
          type: 'textarea',
        },
      },
    ]),
  }),
);

const [ReviewDrawer, reviewDrawerApi] = useVbenDrawer({
  confirmText: t('page.claim.buttons.approve'),
  onClosed() {
    reviewFormApi.resetForm();
    currentReviewItem.value = null;
  },
  onConfirm: () => submitReview('approved'),
  title: t('page.claim.drawer.reviewTitle'),
});

async function open(item: ClaimApi.ClaimResponse) {
  currentReviewItem.value = item;
  await reviewFormApi.resetForm();
  await reviewFormApi.setValues({
    amount_text: `${item.amount.toFixed(2)} ${item.currency}${item.amount_hkd ? ` ≈ HKD ${item.amount_hkd.toFixed(2)}` : ''}`,
    dept_region: `${item.employee_department || '-'} / ${item.employee_region || '-'}`,
    description: item.description || t('page.claim.buttons.noData'),
    employee: `${item.employee_name}（${item.employee_username}）`,
    invoice_date: item.invoice_date || t('page.claim.buttons.noData'),
    invoice_no: item.invoice_no || t('page.claim.buttons.noData'),
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
    ElMessage.warning(t('page.claim.messages.rejectReasonRequired'));
    return;
  }
  reviewDrawerApi.lock(true);
  try {
    await reviewClaimApi(item.id, {
      approval_status: action,
      review_comment: comment || null,
    });
    ElMessage.success(
      action === 'approved'
        ? t('page.claim.messages.approvedSuccess')
        : t('page.claim.messages.rejectedSuccess'),
    );
    reviewDrawerApi.close();
    emit('success');
  } catch {
    ElMessage.error(t('page.claim.messages.operationFailed'));
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
          {{
            currentReviewItem.attachment_name ||
            $t('page.claim.buttons.viewAttachment')
          }}
        </a>
        <span v-else>{{ $t('page.claim.buttons.none') }}</span>
      </template>
    </ReviewForm>
    <template #center-footer>
      <ElButton type="danger" @click="submitReview('rejected')">
        {{ $t('page.claim.buttons.reject') }}
      </ElButton>
    </template>
  </ReviewDrawer>
</template>
