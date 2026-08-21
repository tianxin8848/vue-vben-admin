<script lang="ts" setup>
import { computed, ref } from 'vue';

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
    ElMessage.warning('请输入币种编码');
    return;
  }
  if (!rate || !Number.isFinite(rate) || rate <= 0) {
    ElMessage.warning('请输入有效的港币汇率（大于 0）');
    return;
  }
  if (currencies.value.some((c) => c.currency_code === code)) {
    ElMessage.warning(`币种 ${code} 已存在，请编辑或先删除`);
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
      <h3 class="text-lg">币种维护</h3>
      <span class="text-sm text-muted-foreground">
        共 {{ currencies.length }} 种币种
      </span>
    </div>
    <p class="mb-4 text-sm text-muted-foreground">
      在这里维护报销页面可用币种，以及换算成港币时使用的汇率。
    </p>

    <div class="mb-4 flex flex-wrap gap-2 items-end">
      <ElInput
        v-model="newCode"
        placeholder="币种编码，如 USD"
        class="w-[160px]"
        maxlength="6"
      />
      <ElInputNumber
        v-model="newRate"
        :min="0"
        :precision="4"
        :step="0.1"
        placeholder="港币汇率"
        class="w-[180px]"
        controls-position="right"
      />
      <ElButton type="primary" @click="handleAdd">新增币种</ElButton>
    </div>

    <div class="rounded border border-border overflow-hidden">
      <ElTable
        :data="currencies"
        size="default"
        stripe
        style="width: 100%"
        empty-text=""
      >
        <ElTableColumn type="index" label="序号" width="70" align="center" />
        <ElTableColumn label="币种编码" min-width="140">
          <template #default="{ row }">
            <ElTag type="success" effect="light">
              {{ row.currency_code }}
            </ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn label="兑换港币汇率" min-width="220">
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
        <ElTableColumn label="操作" width="90" align="center" fixed="right">
          <template #default="{ $index }">
            <ElButton
              type="danger"
              link
              size="small"
              @click="handleRemove($index)"
            >
              删除
            </ElButton>
          </template>
        </ElTableColumn>
        <template #empty>
          <ElEmpty description="暂无币种配置，请在上方新增" :image-size="60" />
        </template>
      </ElTable>
    </div>

    <p class="mt-2 text-xs text-muted-foreground">
      汇率含义：1 单位外币 = ? 港币。香港员工报销时会按这里的汇率自动折算港币。
    </p>
  </section>
</template>
