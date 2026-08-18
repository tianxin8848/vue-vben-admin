<script lang="ts" setup>
import type { ClaimApi } from '#/api';

import { computed, reactive, ref } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';
import { useI18n } from '@vben/locales';

import { ElInput, ElInputNumber, ElMessage, ElTag } from 'element-plus';

import { useVbenForm } from '#/adapter/form';
import { updateClaimDraftApi } from '#/api';

const emit = defineEmits<{
  success: [];
}>();

const { t } = useI18n();

const currentDraft = ref<ClaimApi.ClaimResponse | null>(null);

const editForm = reactive({
  amount: 0,
  description: '',
});

const selectedCurrencyRate = computed(() => {
  if (!currentDraft.value) return 1;
  return currentDraft.value.exchange_rate_to_hkd ?? 1;
});

const estimatedHkd = computed(() => {
  return Math.round(editForm.amount * selectedCurrencyRate.value * 100) / 100;
});

const isHkd = computed(
  () => currentDraft.value?.currency === 'HKD' || !currentDraft.value,
);

const [EditForm] = useVbenForm(
  reactive({
    layout: 'vertical',
    showDefaultActions: false,
    wrapperClass: 'grid-cols-2 gap-x-4',
    schema: computed(() => [
      {
        component: 'Input',
        fieldName: 'reason',
        label: t('page.claim.form.reasonLabel'),
        formItemClass: 'col-span-2',
      },
      {
        component: 'Input',
        fieldName: 'currency',
        label: t('page.claim.form.currencyLabel'),
        formItemClass: 'col-span-1',
      },
      {
        component: 'Input',
        fieldName: 'invoice_date',
        label: t('page.claim.form.invoiceDateLabel'),
        formItemClass: 'col-span-1',
      },
      {
        component: 'Input',
        fieldName: 'invoice_no',
        label: t('page.claim.form.invoiceNoLabel'),
        formItemClass: 'col-span-2',
      },
      {
        component: 'Input',
        fieldName: 'amount',
        label: t('page.claim.form.amountLabel'),
        rules: 'required',
        formItemClass: 'col-span-1',
      },
      {
        component: 'Input',
        fieldName: 'description',
        label: t('page.claim.form.descriptionLabel'),
        formItemClass: 'col-span-2',
      },
      {
        component: 'Input',
        fieldName: 'attachment',
        label: t('page.claim.form.attachmentLabel'),
        formItemClass: 'col-span-2',
      },
    ]),
  }),
);

const [EditDrawer, editDrawerApi] = useVbenDrawer({
  confirmText: t('page.claim.buttons.saveChanges'),
  onClosed: resetEditForm,
  onConfirm: submitEdit,
  title: t('page.claim.drawer.editTitle'),
});

function resetEditForm() {
  editForm.amount = 0;
  editForm.description = '';
  currentDraft.value = null;
}

function open(item: ClaimApi.ClaimResponse) {
  currentDraft.value = item;
  editForm.amount = item.amount;
  editForm.description = item.description || '';
  editDrawerApi.open();
}

async function submitEdit() {
  const item = currentDraft.value;
  if (!item) return;
  if (editForm.amount <= 0) {
    ElMessage.warning(t('page.claim.messages.amountPositive'));
    return;
  }
  if (editForm.description.length > 500) {
    ElMessage.warning(t('page.claim.messages.withdrawCommentTooLong'));
    return;
  }

  editDrawerApi.lock(true);
  try {
    await updateClaimDraftApi(item.id, {
      amount: editForm.amount,
      description: editForm.description.trim() || null,
    });
    ElMessage.success(t('page.claim.messages.editSuccess'));
    editDrawerApi.close();
    emit('success');
  } catch {
    ElMessage.error(t('page.claim.messages.editFailed'));
  } finally {
    editDrawerApi.lock(false);
  }
}

defineExpose({ open });
</script>

<template>
  <EditDrawer class="w-[600px]">
    <p class="mb-3 text-xs text-muted-foreground">
      {{ $t('page.claim.messages.editDraftHint') }}
    </p>
    <EditForm>
      <template #reason>
        <ElInput :model-value="currentDraft?.reason_label" disabled />
      </template>
      <template #currency>
        <ElInput :model-value="currentDraft?.currency" disabled />
      </template>
      <template #invoice_date>
        <ElInput
          :model-value="
            currentDraft?.invoice_date || $t('page.claim.buttons.noData')
          "
          disabled
        />
      </template>
      <template #invoice_no>
        <ElInput
          :model-value="
            currentDraft?.invoice_no || $t('page.claim.buttons.noData')
          "
          disabled
        />
      </template>
      <template #amount>
        <ElInputNumber
          v-model="editForm.amount"
          :min="0"
          :precision="2"
          :step="1"
          class="w-full"
        />
        <span v-if="!isHkd" class="mt-1 block text-xs text-muted-foreground">
          ≈ HKD {{ estimatedHkd.toFixed(2) }}
        </span>
      </template>
      <template #description>
        <ElInput
          v-model="editForm.description"
          type="textarea"
          :rows="3"
          :maxlength="500"
          show-word-limit
          :placeholder="$t('page.claim.form.optionalDescription')"
        />
      </template>
      <template #attachment>
        <a
          v-if="currentDraft?.attachment_url"
          :href="currentDraft.attachment_url"
          target="_blank"
        >
          <ElTag type="success" effect="plain">
            {{
              currentDraft.attachment_name ||
              $t('page.claim.buttons.viewAttachment')
            }}
          </ElTag>
        </a>
        <span v-else>{{ $t('page.claim.buttons.none') }}</span>
      </template>
    </EditForm>
  </EditDrawer>
</template>
