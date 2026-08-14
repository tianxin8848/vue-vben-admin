<script lang="ts" setup>
import type { ClaimApi } from '#/api';

import { computed, reactive, ref } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';
import { useI18n } from '@vben/locales';

import { ElButton, ElCheckbox, ElCheckboxGroup, ElMessage } from 'element-plus';

import { useVbenForm } from '#/adapter/form';
import { reviewClaimApi } from '#/api';

const emit = defineEmits<{
  success: [];
}>();

const { t } = useI18n();

const currentReviewItem = ref<ClaimApi.ClaimResponse | null>(null);

// 部分驳回：选中的明细项 ID
const rejectedItemIds = ref<string[]>([]);

const hasItems = computed(
  () => (currentReviewItem.value?.items?.length ?? 0) > 0,
);

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
        fieldName: 'amount_text',
        label: t('page.claim.form.amountLabel'),
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
    rejectedItemIds.value = [];
  },
  onConfirm: () => submitReview('approved'),
  title: t('page.claim.drawer.reviewTitle'),
});

async function open(item: ClaimApi.ClaimResponse) {
  currentReviewItem.value = item;
  rejectedItemIds.value = [];
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
      rejected_item_ids:
        action === 'rejected' && rejectedItemIds.value.length > 0
          ? rejectedItemIds.value
          : undefined,
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
  <ReviewDrawer class="w-[640px]">
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

    <!-- 明细项列表（支持部分驳回选择） -->
    <div v-if="hasItems" class="mt-2">
      <div class="mb-2 text-sm font-medium">
        {{ $t('page.claim.form.itemsLabel') }}
        <span class="ml-1 text-xs text-muted-foreground">
          {{ $t('page.claim.form.itemsRejectTip') }}
        </span>
      </div>
      <ElCheckboxGroup v-model="rejectedItemIds">
        <div
          v-for="(it, idx) in currentReviewItem?.items"
          :key="it.item_id ?? idx"
          class="mb-2 rounded border p-2"
        >
          <ElCheckbox v-if="it.item_id" :value="it.item_id" :label="it.item_id">
            <span class="font-medium">{{ it.reason_label }}</span>
            <span class="ml-2">
              {{ it.amount.toFixed(2) }} {{ it.currency }}
              <span v-if="it.amount_hkd" class="text-xs text-muted-foreground">
                ≈ HKD {{ it.amount_hkd.toFixed(2) }}
              </span>
            </span>
          </ElCheckbox>
          <div v-else class="font-medium">
            {{ it.reason_label }}
            <span class="ml-2">
              {{ it.amount.toFixed(2) }} {{ it.currency }}
            </span>
          </div>
          <div
            v-if="it.description || it.invoice_date || it.invoice_no"
            class="ml-6 text-xs text-muted-foreground"
          >
            <div v-if="it.description">{{ it.description }}</div>
            <div v-if="it.invoice_date || it.invoice_no" class="mt-0.5">
              <span v-if="it.invoice_date">
                {{ $t('page.claim.form.invoiceDateLabel') }}:
                {{ it.invoice_date }}
              </span>
              <span v-if="it.invoice_no" class="ml-2">
                {{ $t('page.claim.form.invoiceNoLabel') }}: {{ it.invoice_no }}
              </span>
            </div>
          </div>
          <div class="ml-6">
            <a
              v-if="it.attachment_url"
              :href="it.attachment_url"
              target="_blank"
              class="text-xs"
            >
              {{
                it.attachment_name || $t('page.claim.buttons.viewAttachment')
              }}
            </a>
          </div>
        </div>
      </ElCheckboxGroup>
    </div>

    <template #center-footer>
      <ElButton type="danger" @click="submitReview('rejected')">
        {{ $t('page.claim.buttons.reject') }}
      </ElButton>
    </template>
  </ReviewDrawer>
</template>
