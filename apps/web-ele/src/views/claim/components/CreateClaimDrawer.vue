<script lang="ts" setup>
import type { ClaimApi } from '#/api';

import { computed, reactive } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';

import {
  ElButton,
  ElInput,
  ElInputNumber,
  ElMessage,
  ElOption,
  ElSelect,
  ElUpload,
} from 'element-plus';

import { useVbenForm } from '#/adapter/form';
import { createClaimApi } from '#/api';

const props = defineProps<{
  currencyOptions: ClaimApi.ClaimCurrencyOption[];
  reasonOptions: ClaimApi.ClaimReasonOption[];
}>();

const emit = defineEmits<{
  success: [];
}>();

const createForm = reactive({
  amount: 0,
  attachmentFile: null as File | null,
  currency: 'HKD',
  description: '',
  reason_code: '',
});

const selectedCurrencyRate = computed(() => {
  const found = props.currencyOptions.find(
    (c) => c.currency_code === createForm.currency,
  );
  return found?.to_hkd_rate ?? 1;
});

const estimatedHkd = computed(() => {
  return Math.round(createForm.amount * selectedCurrencyRate.value * 100) / 100;
});

const [CreateForm] = useVbenForm({
  layout: 'vertical',
  showDefaultActions: false,
  wrapperClass: 'grid-cols-2 gap-x-4',
  schema: [
    {
      component: 'Input',
      fieldName: 'reason_code',
      label: '报销理由',
      rules: 'required',
      formItemClass: 'col-span-2',
    },
    {
      component: 'Input',
      fieldName: 'amount',
      label: '金额',
      rules: 'required',
      formItemClass: 'col-span-1',
    },
    {
      component: 'Input',
      fieldName: 'currency',
      label: '币种',
      rules: 'required',
      formItemClass: 'col-span-1',
    },
    {
      component: 'Input',
      fieldName: 'description',
      label: '说明',
      formItemClass: 'col-span-2',
    },
    {
      component: 'Input',
      fieldName: 'attachment',
      label: '附件',
      rules: 'required',
      formItemClass: 'col-span-2',
    },
  ],
});

const [CreateDrawer, createDrawerApi] = useVbenDrawer({
  confirmText: '提交申请',
  onClosed: resetCreateForm,
  onConfirm: submitCreate,
  title: '新建报销申请',
});

function resetCreateForm() {
  createForm.amount = 0;
  createForm.attachmentFile = null;
  createForm.currency = props.currencyOptions[0]?.currency_code || 'HKD';
  createForm.description = '';
  createForm.reason_code = '';
}

function handleFileChange(uploadFile: any) {
  createForm.attachmentFile = uploadFile.raw || null;
}

async function submitCreate() {
  if (!createForm.reason_code) {
    ElMessage.warning('请选择报销理由');
    return;
  }
  if (createForm.amount <= 0) {
    ElMessage.warning('金额必须大于 0');
    return;
  }
  if (!createForm.attachmentFile) {
    ElMessage.warning('请上传附件');
    return;
  }

  createDrawerApi.lock(true);
  try {
    const fd = new FormData();
    fd.append('reason_code', createForm.reason_code);
    fd.append('amount', String(createForm.amount));
    fd.append('currency', createForm.currency);
    if (createForm.description) {
      fd.append('description', createForm.description);
    }
    fd.append('attachment', createForm.attachmentFile);
    await createClaimApi(fd);
    ElMessage.success('报销申请已提交');
    createDrawerApi.close();
    emit('success');
  } catch {
    ElMessage.error('提交失败');
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
          placeholder="请选择"
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
          :min="0.01"
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
      <template #description>
        <ElInput
          v-model="createForm.description"
          type="textarea"
          :rows="3"
          placeholder="可选，补充说明报销用途"
        />
      </template>
      <template #attachment>
        <ElUpload
          :auto-upload="false"
          :limit="1"
          accept="image/*,.pdf"
          @change="handleFileChange"
        >
          <ElButton>选择文件</ElButton>
          <template #tip>
            <span class="block text-xs text-muted-foreground">
              支持图片或 PDF，用于报销凭证
            </span>
          </template>
        </ElUpload>
      </template>
    </CreateForm>
  </CreateDrawer>
</template>
