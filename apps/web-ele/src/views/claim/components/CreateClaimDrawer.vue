<script lang="ts" setup>
import type { ClaimApi } from '#/api';

import { computed, reactive, ref } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';
import { useI18n } from '@vben/locales';

import {
  ElButton,
  ElDatePicker,
  ElInput,
  ElInputNumber,
  ElOption,
  ElSelect,
  ElUpload,
} from 'element-plus';

import { useVbenForm } from '#/adapter/form';
import { createClaimApi } from '#/api';
import { handleActionError, toastSuccess, toastWarning } from '#/utils/message';

const props = defineProps<{
  currencyOptions: ClaimApi.ClaimCurrencyOption[];
  reasonOptions: ClaimApi.ClaimReasonOption[];
}>();

const emit = defineEmits<{
  success: [];
}>();

const { t } = useI18n();

const createForm = reactive({
  amount: 0,
  attachmentFile: null as File | null,
  currency: 'HKD',
  description: '',
  invoice_date: '' as string,
  invoice_no: '',
  reason_code: '',
});

const uploadRef = ref<any>(null);

const selectedCurrencyRate = computed(() => {
  const found = props.currencyOptions.find(
    (c) => c.currency_code === createForm.currency,
  );
  return found?.to_hkd_rate ?? 1;
});

const estimatedHkd = computed(() => {
  return Math.round(createForm.amount * selectedCurrencyRate.value * 100) / 100;
});

const [CreateForm] = useVbenForm(
  reactive({
    layout: 'vertical',
    showDefaultActions: false,
    wrapperClass: 'grid-cols-2 gap-x-4',
    schema: computed(() => [
      {
        component: 'Input',
        fieldName: 'reason_code',
        label: t('page.claim.form.reasonLabel'),
        rules: 'required',
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
        fieldName: 'currency',
        label: t('page.claim.form.currencyLabel'),
        rules: 'required',
        formItemClass: 'col-span-1',
      },
      {
        component: 'DatePicker',
        fieldName: 'invoice_date',
        label: t('page.claim.form.invoiceDateLabel'),
        rules: 'required',
        formItemClass: 'col-span-1',
        componentProps: {
          type: 'date',
          // 显示与手打解析均为 DD-MM-YYYY（如 21-09-2026），回传后端仍是 ISO
          editable: true,
          format: 'DD-MM-YYYY',
          placeholder: t('page.claim.form.invoiceDatePlaceholder'),
          valueFormat: 'YYYY-MM-DD',
          class: 'w-full',
        },
      },
      {
        component: 'Input',
        fieldName: 'invoice_no',
        label: t('page.claim.form.invoiceNoLabel'),
        formItemClass: 'col-span-1',
        componentProps: {
          placeholder: t('page.claim.form.invoiceNoPlaceholder'),
          maxlength: 100,
          clearable: true,
        },
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
        rules: 'required',
        formItemClass: 'col-span-2',
      },
    ]),
  }),
);

const [CreateDrawer, createDrawerApi] = useVbenDrawer({
  confirmText: t('page.claim.buttons.saveDraft'),
  onClosed: resetCreateForm,
  onConfirm: submitCreate,
  title: t('page.claim.drawer.createTitle'),
});

function resetCreateForm() {
  createForm.amount = 0;
  createForm.attachmentFile = null;
  createForm.currency = props.currencyOptions[0]?.currency_code || 'HKD';
  createForm.description = '';
  createForm.invoice_date = '';
  createForm.invoice_no = '';
  createForm.reason_code = '';
  uploadRef.value?.clearFiles();
}

function handleFileChange(uploadFile: any) {
  createForm.attachmentFile = uploadFile.raw || null;
}

async function submitCreate() {
  if (!createForm.reason_code) {
    toastWarning(t('page.claim.messages.selectReason'));
    return;
  }
  if (createForm.amount <= 0) {
    toastWarning(t('page.claim.messages.amountPositive'));
    return;
  }
  if (!createForm.invoice_date) {
    toastWarning(t('page.claim.messages.invoiceDateRequired'));
    return;
  }
  if (!createForm.attachmentFile) {
    toastWarning(t('page.claim.messages.uploadAttachment'));
    return;
  }

  createDrawerApi.lock(true);
  try {
    const fd = new FormData();
    fd.append('reason_code', createForm.reason_code);
    fd.append('amount', String(createForm.amount));
    fd.append('currency', createForm.currency);
    fd.append('invoice_date', createForm.invoice_date);
    if (createForm.description) {
      fd.append('description', createForm.description);
    }
    if (createForm.invoice_no) {
      fd.append('invoice_no', createForm.invoice_no);
    }
    fd.append('attachment', createForm.attachmentFile);
    await createClaimApi(fd);
    toastSuccess(t('page.claim.messages.draftCreated'));
    createDrawerApi.close();
    emit('success');
  } catch (error) {
    handleActionError(
      'claim/CreateClaimDrawer',
      error,
      t('page.claim.messages.submitFailed'),
    );
  } finally {
    createDrawerApi.lock(false);
  }
}

function open() {
  resetCreateForm();
  createDrawerApi.open();
}

defineExpose({ open });
</script>

<template>
  <CreateDrawer class="w-[600px]">
    <CreateForm>
      <template #reason_code>
        <ElSelect
          v-model="createForm.reason_code"
          :placeholder="$t('page.claim.form.reasonPlaceholder')"
          class="w-full"
        >
          <ElOption
            v-for="r in reasonOptions"
            :key="r.name"
            :label="r.name"
            :value="r.name"
          />
        </ElSelect>
      </template>
      <template #amount>
        <ElInputNumber
          v-model="createForm.amount"
          :min="0"
          :precision="2"
          :step="1"
          class="w-full"
        />
      </template>
      <template #currency>
        <ElSelect v-model="createForm.currency" class="w-full">
          <ElOption
            v-for="c in currencyOptions"
            :key="c.currency_code"
            :label="c.currency_code"
            :value="c.currency_code"
          />
        </ElSelect>
        <span
          v-if="createForm.currency !== 'HKD'"
          class="mt-1 block text-xs text-muted-foreground"
        >
          ≈ HKD {{ estimatedHkd.toFixed(2) }}
        </span>
      </template>
      <template #invoice_date>
        <ElDatePicker
          v-model="createForm.invoice_date"
          editable
          format="DD-MM-YYYY"
          type="date"
          :placeholder="$t('page.claim.form.invoiceDatePlaceholder')"
          value-format="YYYY-MM-DD"
          style="width: 100%"
        />
      </template>
      <template #invoice_no>
        <ElInput
          v-model="createForm.invoice_no"
          :placeholder="$t('page.claim.form.invoiceNoPlaceholder')"
          :maxlength="100"
          clearable
        />
      </template>
      <template #description>
        <ElInput
          v-model="createForm.description"
          type="textarea"
          :rows="3"
          :placeholder="$t('page.claim.form.optionalDescription')"
        />
      </template>
      <template #attachment>
        <ElUpload
          ref="uploadRef"
          :auto-upload="false"
          :limit="1"
          accept="image/*,.pdf"
          @change="handleFileChange"
        >
          <ElButton>{{ $t('page.claim.buttons.selectFile') }}</ElButton>
          <template #tip>
            <span class="block text-xs text-muted-foreground">
              {{ $t('page.claim.form.attachmentTip') }}
            </span>
          </template>
        </ElUpload>
      </template>
    </CreateForm>
  </CreateDrawer>
</template>
