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

import {
  CLAIM_ATTACHMENT_ACCEPT,
  MAX_CLAIM_ATTACHMENTS,
  useClaimAttachments,
} from '../composables/useClaimAttachments';

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
  currency: 'HKD',
  description: '',
  invoice_date: '' as string,
  invoice_no: '',
  reason_code: '',
});

/**
 * 附件：一单一笔费用，同一笔可带多个附件（最多 20 个）。
 * 每个附件单独标注是「发票」还是「支持文件」，选择顺序即提交顺序。
 */
const { addFile, count, items, removeItem, reset, toPayload } =
  useClaimAttachments();

const uploadRef = ref<InstanceType<typeof ElUpload>>();

const selectedCurrencyRate = computed(() => {
  const found = props.currencyOptions.find(
    (c) => c.currency_code === createForm.currency,
  );
  return found?.to_hkd_rate ?? 1;
});

/** 非 HKD 时展示折算金额（后端会按同日汇率重算） */
const estimatedHkd = computed(
  () =>
    Math.round(
      Number(createForm.amount || 0) * selectedCurrencyRate.value * 100,
    ) / 100,
);

const [CreateForm] = useVbenForm(
  reactive({
    layout: 'vertical',
    showDefaultActions: false,
    wrapperClass: 'grid-cols-2 gap-x-4',
    schema: [
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
    ],
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
  createForm.currency = props.currencyOptions[0]?.currency_code || 'HKD';
  createForm.description = '';
  createForm.invoice_date = '';
  createForm.invoice_no = '';
  createForm.reason_code = '';
  reset();
  uploadRef.value?.clearFiles();
}

/**
 * ElUpload 只负责「选文件」，文件列表由本组件渲染（要逐个选附件类型）。
 * 因此 `show-file-list` 关闭，删除也走自定义按钮，不会触发 remove 事件。
 */
function handleSelect(uploadFile: { raw?: File }) {
  const raw = uploadFile?.raw;
  if (raw instanceof File) {
    addFile(raw);
  }
}

/** 无缩略图时的占位文字：取扩展名（PDF / OFD / XML …） */
function attachmentBadge(fileName: string) {
  const index = fileName.lastIndexOf('.');
  return index === -1 ? 'FILE' : fileName.slice(index + 1).toUpperCase();
}

async function submitCreate() {
  if (!createForm.reason_code) {
    toastWarning(t('page.claim.messages.selectReason'));
    return;
  }
  if (!createForm.invoice_date) {
    toastWarning(t('page.claim.messages.invoiceDateRequired'));
    return;
  }
  if (count.value === 0) {
    toastWarning(t('page.claim.messages.uploadAttachment'));
    return;
  }
  if (Number(createForm.amount) <= 0) {
    toastWarning(t('page.claim.messages.amountPositive'));
    return;
  }

  createDrawerApi.lock(true);
  try {
    const fd = new FormData();
    // 单行金额 + 多个附件：后端把全部附件都挂在这一笔上
    fd.append('reason_code', createForm.reason_code);
    fd.append('invoice_date', createForm.invoice_date);
    fd.append('amount', String(Number(createForm.amount) || 0));
    fd.append('currency', createForm.currency);
    // 可选字段不传即由后端补 null，不要 append 空串
    if (createForm.description) {
      fd.append('description', createForm.description);
    }
    if (createForm.invoice_no) {
      fd.append('invoice_no', createForm.invoice_no);
    }
    // 附件按选择顺序 append，attachment_kind 必须与文件数一一对应
    for (const { file, kind } of toPayload()) {
      fd.append('attachment', file);
      fd.append('attachment_kind', kind);
    }
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
          :placeholder="$t('page.claim.form.amountPlaceholder')"
        />
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
        <div class="flex w-full flex-col gap-2">
          <div class="flex items-center gap-3">
            <ElUpload
              ref="uploadRef"
              :accept="CLAIM_ATTACHMENT_ACCEPT"
              :auto-upload="false"
              :show-file-list="false"
              multiple
              @change="handleSelect"
            >
              <ElButton>{{ $t('page.claim.buttons.selectFile') }}</ElButton>
            </ElUpload>
            <span class="text-xs text-muted-foreground">
              {{
                $t('page.claim.form.attachmentCount', {
                  count,
                  max: MAX_CLAIM_ATTACHMENTS,
                })
              }}
            </span>
          </div>
          <p class="text-xs text-muted-foreground">
            {{ $t('page.claim.form.attachmentTip') }}
          </p>

          <div v-if="items.length" class="flex flex-col gap-2">
            <div
              v-for="item in items"
              :key="item.key"
              class="flex items-center gap-3 rounded border border-solid border-[var(--el-border-color)] p-2"
            >
              <img
                v-if="item.previewUrl"
                :src="item.previewUrl"
                alt=""
                class="h-10 w-10 shrink-0 rounded object-cover"
              />
              <span
                v-else
                class="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-[var(--el-fill-color-light)] text-[10px] leading-none text-muted-foreground"
              >
                {{ attachmentBadge(item.file.name) }}
              </span>
              <span
                class="min-w-0 flex-1 truncate text-sm"
                :title="item.file.name"
              >
                {{ item.file.name }}
              </span>
              <ElSelect v-model="item.kind" class="w-[110px]" size="small">
                <ElOption
                  :label="$t('page.claim.form.attachmentKind.invoice')"
                  value="invoice"
                />
                <ElOption
                  :label="$t('page.claim.form.attachmentKind.supporting')"
                  value="supporting"
                />
              </ElSelect>
              <ElButton
                link
                size="small"
                type="danger"
                @click="removeItem(item.key)"
              >
                {{ $t('page.claim.buttons.delete') }}
              </ElButton>
            </div>
          </div>
        </div>
      </template>
    </CreateForm>
  </CreateDrawer>
</template>
