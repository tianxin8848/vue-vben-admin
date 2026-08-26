<script lang="ts" setup>
import { computed, ref } from 'vue';

import { useI18n } from '@vben/locales';

import {
  ElButton,
  ElEmpty,
  ElInput,
  ElInputNumber,
  ElMessage,
  ElTable,
  ElTableColumn,
  ElTag,
} from 'element-plus';

interface CurrencyRow {
  currency_code: string;
  to_hkd_rate: number;
}

const props = defineProps<{
  modelValue: string;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
}>();

const { t } = useI18n();

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

function syncToParent(list: CurrencyRow[]) {
  const str = list
    .map((item) => `${item.currency_code},${item.to_hkd_rate}`)
    .join('\n');
  emit('update:modelValue', str);
}

function handleAdd() {
  const code = newCode.value.trim().toUpperCase();
  const rate = newRate.value;
  if (!code) {
    ElMessage.warning(
      t('page.system.settingsDetail.currencyEditor.validation.codeRequired'),
    );
    return;
  }
  if (!rate || !Number.isFinite(rate) || rate <= 0) {
    ElMessage.warning(
      t('page.system.settingsDetail.currencyEditor.validation.rateInvalid'),
    );
    return;
  }
  if (currencies.value.some((c) => c.currency_code === code)) {
    ElMessage.warning(
      t('page.system.settingsDetail.currencyEditor.validation.duplicate', {
        code,
      }),
    );
    return;
  }
  syncToParent([
    ...currencies.value,
    { currency_code: code, to_hkd_rate: rate },
  ]);
  newCode.value = '';
  newRate.value = null;
}

function handleRemove(idx: number) {
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
      <h3 class="text-lg">
        {{ t('page.system.settingsDetail.currencyEditor.title') }}
      </h3>
      <span class="text-sm text-muted-foreground">
        {{
          t('page.system.settingsDetail.currencyEditor.count', {
            count: currencies.length,
          })
        }}
      </span>
    </div>
    <p class="mb-4 text-sm text-muted-foreground">
      {{ t('page.system.settingsDetail.currencyEditor.hint') }}
    </p>

    <div class="mb-4 flex flex-wrap gap-2 items-end">
      <ElInput
        v-model="newCode"
        :placeholder="
          t('page.system.settingsDetail.currencyEditor.codePlaceholder')
        "
        class="w-[160px]"
        maxlength="6"
      />
      <ElInputNumber
        v-model="newRate"
        :min="0"
        :precision="4"
        :step="0.1"
        :placeholder="
          t('page.system.settingsDetail.currencyEditor.ratePlaceholder')
        "
        class="w-[180px]"
        controls-position="right"
      />
      <ElButton type="primary" @click="handleAdd">
        {{ t('page.system.settingsDetail.currencyEditor.add') }}
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
          :label="t('page.system.settingsDetail.currencyEditor.column.seq')"
          width="70"
          align="center"
        />
        <ElTableColumn
          :label="t('page.system.settingsDetail.currencyEditor.column.code')"
          min-width="140"
        >
          <template #default="{ row }">
            <ElTag type="success" effect="light">
              {{ row.currency_code }}
            </ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn
          :label="t('page.system.settingsDetail.currencyEditor.column.rate')"
          min-width="220"
        >
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
          :label="t('page.system.settingsDetail.currencyEditor.column.action')"
          width="90"
          align="center"
          fixed="right"
        >
          <template #default="{ $index }">
            <ElButton
              type="danger"
              link
              size="small"
              @click="handleRemove($index)"
            >
              {{ t('page.system.settingsDetail.currencyEditor.delete') }}
            </ElButton>
          </template>
        </ElTableColumn>
        <template #empty>
          <ElEmpty
            :description="t('page.system.settingsDetail.currencyEditor.empty')"
            :image-size="60"
          />
        </template>
      </ElTable>
    </div>

    <p class="mt-2 text-xs text-muted-foreground">
      {{ t('page.system.settingsDetail.currencyEditor.footerHint') }}
    </p>
  </section>
</template>
