<script lang="ts" setup>
import { computed, ref } from 'vue';

import { useI18n } from '@vben/locales';

import {
  ElButton,
  ElDialog,
  ElEmpty,
  ElInput,
  ElMessage,
  ElMessageBox,
  ElTable,
  ElTableColumn,
} from 'element-plus';

interface ReasonRow {
  reason: string;
}

const props = defineProps<{
  modelValue: string;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
  (e: 'save'): void;
}>();

const { t } = useI18n();

const i18nPrefix = 'page.system.settingsDetail.claimReasonEditor';

const reasons = computed<ReasonRow[]>(() =>
  props.modelValue
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => ({ reason: s })),
);

const newReason = ref('');
const dialogVisible = ref(false);
const editingIdx = ref(-1);
const inputValue = ref('');

function syncToParent(list: ReasonRow[]) {
  emit('update:modelValue', list.map((r) => r.reason).join('\n'));
  // 单条变更后立即触发父组件全量 PUT
  emit('save');
}

function handleAdd() {
  const name = newReason.value.trim();
  if (!name) {
    ElMessage.warning(t(`${i18nPrefix}.validation.reasonRequired`));
    return;
  }
  if (reasons.value.some((r) => r.reason === name)) {
    ElMessage.warning(t(`${i18nPrefix}.validation.reasonDuplicate`));
    return;
  }
  syncToParent([...reasons.value, { reason: name }]);
  newReason.value = '';
}

function openEdit(idx: number) {
  editingIdx.value = idx;
  inputValue.value = reasons.value[idx]?.reason || '';
  dialogVisible.value = true;
}

function submitEdit() {
  const value = inputValue.value.trim();
  if (!value) {
    ElMessage.warning(t(`${i18nPrefix}.validation.reasonRequired`));
    return;
  }
  const current = reasons.value[editingIdx.value]?.reason;
  const isDuplicate =
    reasons.value.some((r) => r.reason === value) && current !== value;
  if (isDuplicate) {
    ElMessage.warning(t(`${i18nPrefix}.validation.reasonDuplicate`));
    return;
  }
  const next = [...reasons.value];
  next[editingIdx.value] = { reason: value };
  syncToParent(next);
  inputValue.value = '';
  editingIdx.value = -1;
  dialogVisible.value = false;
}

async function handleRemove(idx: number) {
  const row = reasons.value[idx];
  if (!row) return;
  try {
    await ElMessageBox.confirm(
      t(`${i18nPrefix}.deleteConfirm`, { name: row.reason }),
      t(`${i18nPrefix}.deleteConfirmTitle`),
      {
        confirmButtonText: t(`${i18nPrefix}.confirm`),
        cancelButtonText: t(`${i18nPrefix}.cancel`),
        type: 'warning',
      },
    );
    const next = [...reasons.value];
    next.splice(idx, 1);
    syncToParent(next);
  } catch {
    // 用户取消删除
  }
}
</script>

<template>
  <section>
    <div class="mb-3 flex items-center justify-between">
      <h3 class="text-lg">{{ t(`${i18nPrefix}.title`) }}</h3>
      <span class="text-sm text-muted-foreground">
        {{ t(`${i18nPrefix}.count`, { count: reasons.length }) }}
      </span>
    </div>
    <p class="mb-4 text-sm text-muted-foreground">
      {{ t(`${i18nPrefix}.hint`) }}
    </p>

    <div class="mb-4 flex gap-2">
      <ElInput
        v-model="newReason"
        :placeholder="t(`${i18nPrefix}.placeholder`)"
        class="flex-1"
        @keyup.enter="handleAdd"
      />
      <ElButton type="primary" @click="handleAdd">
        {{ t(`${i18nPrefix}.add`) }}
      </ElButton>
    </div>

    <div class="rounded border border-border overflow-hidden">
      <ElTable
        :data="reasons"
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
        <ElTableColumn
          :label="t(`${i18nPrefix}.column.reason`)"
          min-width="220"
        >
          <template #default="{ row }">{{ row.reason }}</template>
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

    <!-- 编辑对话框 -->
    <ElDialog
      v-model="dialogVisible"
      :title="t(`${i18nPrefix}.editTitle`)"
      width="400px"
    >
      <ElInput
        v-model="inputValue"
        :placeholder="t(`${i18nPrefix}.placeholder`)"
        @keyup.enter="submitEdit"
      />
      <template #footer>
        <ElButton @click="dialogVisible = false">
          {{ t(`${i18nPrefix}.cancel`) }}
        </ElButton>
        <ElButton type="primary" @click="submitEdit">
          {{ t(`${i18nPrefix}.confirm`) }}
        </ElButton>
      </template>
    </ElDialog>
  </section>
</template>
