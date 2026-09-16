<script lang="ts" setup>
import { computed, ref } from 'vue';

import { useI18n } from '@vben/locales';

import {
  ElButton,
  ElDialog,
  ElEmpty,
  ElForm,
  ElFormItem,
  ElInput,
  ElInputNumber,
  ElMessage,
  ElTable,
  ElTableColumn,
  ElTag,
} from 'element-plus';

import { confirmDelete } from '#/utils/modal';

interface CurrencyRow {
  currency_code: string;
  to_hkd_rate: number;
}

const props = defineProps<{
  modelValue: string;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
  (e: 'save'): void;
}>();

const { t } = useI18n();

const i18nPrefix = 'page.system.settingsDetail.currencyEditor';

const currencies = computed<CurrencyRow[]>(() => {
  return props.modelValue
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [code, rateText] = line.split(',').map((p) => p.trim());
      return {
        currency_code: (code || '').toUpperCase(),
        to_hkd_rate: Number(rateText),
      };
    })
    .filter(
      (item) =>
        item.currency_code &&
        Number.isFinite(item.to_hkd_rate) &&
        item.to_hkd_rate > 0,
    );
});

const newCode = ref('');
const newRate = ref<null | number>(null);

// 编辑币种编码 dialog 状态
const editDialogVisible = ref(false);
const editingIdx = ref(-1);
const editingCode = ref('');
const editingRate = ref<null | number>(null);

function syncToParent(list: CurrencyRow[]) {
  const str = list
    .map((item) => `${item.currency_code},${item.to_hkd_rate}`)
    .join('\n');
  emit('update:modelValue', str);
  // 单条变更后立即触发父组件全量 PUT
  emit('save');
}

function handleAdd() {
  const code = newCode.value.trim().toUpperCase();
  const rate = newRate.value;
  if (!code) {
    ElMessage.warning(t(`${i18nPrefix}.validation.codeRequired`));
    return;
  }
  if (!rate || !Number.isFinite(rate) || rate <= 0) {
    ElMessage.warning(t(`${i18nPrefix}.validation.rateInvalid`));
    return;
  }
  if (currencies.value.some((c) => c.currency_code === code)) {
    ElMessage.warning(t(`${i18nPrefix}.validation.duplicate`, { code }));
    return;
  }
  syncToParent([
    ...currencies.value,
    { currency_code: code, to_hkd_rate: rate },
  ]);
  newCode.value = '';
  newRate.value = null;
}

function openEdit(idx: number) {
  const row = currencies.value[idx];
  if (!row) return;
  editingIdx.value = idx;
  editingCode.value = row.currency_code;
  editingRate.value = row.to_hkd_rate;
  editDialogVisible.value = true;
}

function submitEdit() {
  const code = editingCode.value.trim().toUpperCase();
  const rate = editingRate.value;
  if (!code) {
    ElMessage.warning(t(`${i18nPrefix}.validation.codeRequired`));
    return;
  }
  if (!rate || !Number.isFinite(rate) || rate <= 0) {
    ElMessage.warning(t(`${i18nPrefix}.validation.rateInvalid`));
    return;
  }
  const isDuplicate =
    currencies.value.some((c) => c.currency_code === code) &&
    currencies.value[editingIdx.value]?.currency_code !== code;
  if (isDuplicate) {
    ElMessage.warning(t(`${i18nPrefix}.validation.duplicate`, { code }));
    return;
  }
  const next = currencies.value.map((c, i) =>
    i === editingIdx.value ? { currency_code: code, to_hkd_rate: rate } : c,
  );
  syncToParent(next);
  editingCode.value = '';
  editingRate.value = null;
  editingIdx.value = -1;
  editDialogVisible.value = false;
}

async function handleRemove(idx: number) {
  const row = currencies.value[idx];
  if (!row) return;
  const confirmed = await confirmDelete({
    message: t(`${i18nPrefix}.deleteConfirm`, { code: row.currency_code }),
    title: t(`${i18nPrefix}.deleteConfirmTitle`),
  });
  if (!confirmed) return;
  const next = [...currencies.value];
  next.splice(idx, 1);
  syncToParent(next);
}

function handleRateChange(idx: number, val: null | number | undefined) {
  if (val === null || val === undefined || !Number.isFinite(val) || val <= 0)
    return;
  const next = currencies.value.map((c, i) =>
    i === idx ? { ...c, to_hkd_rate: val } : c,
  );
  syncToParent(next);
}
</script>

<template>
  <section>
    <div class="mb-3 flex items-center justify-between">
      <h3 class="text-lg">{{ t(`${i18nPrefix}.title`) }}</h3>
      <span class="text-sm text-muted-foreground">
        {{ t(`${i18nPrefix}.count`, { count: currencies.length }) }}
      </span>
    </div>
    <p class="mb-4 text-sm text-muted-foreground">
      {{ t(`${i18nPrefix}.hint`) }}
    </p>

    <div class="mb-4 flex flex-wrap gap-2 items-end">
      <ElInput
        v-model="newCode"
        :placeholder="t(`${i18nPrefix}.codePlaceholder`)"
        class="w-[160px]"
        maxlength="6"
      />
      <ElInputNumber
        v-model="newRate"
        :min="0"
        :precision="4"
        :step="0.1"
        :placeholder="t(`${i18nPrefix}.ratePlaceholder`)"
        class="w-[180px]"
        controls-position="right"
      />
      <ElButton type="primary" @click="handleAdd">
        {{ t(`${i18nPrefix}.add`) }}
      </ElButton>
    </div>

    <div class="rounded border border-border overflow-hidden">
      <ElTable
        :data="currencies"
        size="default"
        stripe
        style="width: 100%"
        empty-text=""
      >
        <ElTableColumn
          type="index"
          :label="t(`${i18nPrefix}.column.seq`)"
          width="70"
          align="center"
        />
        <ElTableColumn :label="t(`${i18nPrefix}.column.code`)" min-width="140">
          <template #default="{ row }">
            <ElTag type="success" effect="light">
              {{ row.currency_code }}
            </ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn :label="t(`${i18nPrefix}.column.rate`)" min-width="220">
          <template #default="{ row, $index }">
            <div class="flex items-center gap-2">
              <span class="text-muted-foreground">1</span>
              <ElTag type="warning" effect="plain">
                {{ row.currency_code }}
              </ElTag>
              <span class="text-muted-foreground">=</span>
              <ElInputNumber
                :model-value="row.to_hkd_rate"
                :min="0"
                :precision="4"
                :step="0.01"
                size="small"
                controls-position="right"
                class="w-[140px]"
                @update:model-value="(v) => handleRateChange($index, v ?? null)"
              />
              <ElTag type="info" effect="plain">HKD</ElTag>
            </div>
          </template>
        </ElTableColumn>
        <ElTableColumn
          :label="t(`${i18nPrefix}.column.action`)"
          width="140"
          align="center"
          fixed="right"
        >
          <template #default="{ $index }">
            <ElButton
              size="small"
              link
              type="primary"
              @click="openEdit($index)"
            >
              {{ t(`${i18nPrefix}.edit`) }}
            </ElButton>
            <ElButton
              size="small"
              link
              type="danger"
              @click="handleRemove($index)"
            >
              {{ t(`${i18nPrefix}.delete`) }}
            </ElButton>
          </template>
        </ElTableColumn>
        <template #empty>
          <ElEmpty :description="t(`${i18nPrefix}.empty`)" :image-size="60" />
        </template>
      </ElTable>
    </div>

    <p class="mt-2 text-xs text-muted-foreground">
      {{ t(`${i18nPrefix}.footerHint`) }}
    </p>

    <!-- 编辑币种对话框（可同时改 code 和 rate） -->
    <ElDialog
      v-model="editDialogVisible"
      :title="t(`${i18nPrefix}.editTitle`)"
      width="400px"
    >
      <ElForm
        :model="{ code: editingCode, rate: editingRate }"
        label-width="100px"
      >
        <ElFormItem :label="t(`${i18nPrefix}.column.code`)">
          <ElInput
            v-model="editingCode"
            :placeholder="t(`${i18nPrefix}.codePlaceholder`)"
            maxlength="6"
          />
        </ElFormItem>
        <ElFormItem :label="t(`${i18nPrefix}.column.rate`)">
          <ElInputNumber
            v-model="editingRate"
            :min="0"
            :precision="4"
            :step="0.01"
            :placeholder="t(`${i18nPrefix}.ratePlaceholder`)"
            controls-position="right"
            class="!w-full"
          />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="editDialogVisible = false">
          {{ t(`${i18nPrefix}.cancel`) }}
        </ElButton>
        <ElButton type="primary" @click="submitEdit">
          {{ t(`${i18nPrefix}.confirm`) }}
        </ElButton>
      </template>
    </ElDialog>
  </section>
</template>
