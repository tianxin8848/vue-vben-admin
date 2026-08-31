<script lang="ts" setup>
import type { SystemSettingsApi } from '#/api';

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

const props = defineProps<{
  modelValue: SystemSettingsApi.LeaveTypeItem[];
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: SystemSettingsApi.LeaveTypeItem[]): void;
  (e: 'save'): void;
}>();

const { t } = useI18n();

const i18nPrefix = 'page.system.settingsDetail.leaveTypeEditor';

const list = computed(() => props.modelValue || []);

const newCode = ref('');
const newLabel = ref('');
const dialogVisible = ref(false);
const editingIdx = ref(-1);
const editCode = ref('');
const editLabel = ref('');

function syncToParent(next: SystemSettingsApi.LeaveTypeItem[]) {
  emit('update:modelValue', next);
  // 单条变更后立即触发父组件全量 PUT
  emit('save');
}

function handleAdd() {
  const code = newCode.value.trim();
  const label = newLabel.value.trim();
  if (!code) {
    ElMessage.warning(t(`${i18nPrefix}.validation.codeRequired`));
    return;
  }
  if (!label) {
    ElMessage.warning(t(`${i18nPrefix}.validation.labelRequired`));
    return;
  }
  if (list.value.some((r) => r.code === code)) {
    ElMessage.warning(t(`${i18nPrefix}.validation.codeDuplicate`));
    return;
  }
  syncToParent([...list.value, { code, label }]);
  newCode.value = '';
  newLabel.value = '';
}

function openEdit(idx: number) {
  editingIdx.value = idx;
  editCode.value = list.value[idx]?.code || '';
  editLabel.value = list.value[idx]?.label || '';
  dialogVisible.value = true;
}

function submitEdit() {
  const code = editCode.value.trim();
  const label = editLabel.value.trim();
  if (!code) {
    ElMessage.warning(t(`${i18nPrefix}.validation.codeRequired`));
    return;
  }
  if (!label) {
    ElMessage.warning(t(`${i18nPrefix}.validation.labelRequired`));
    return;
  }
  const current = list.value[editingIdx.value]?.code;
  if (list.value.some((r) => r.code === code) && current !== code) {
    ElMessage.warning(t(`${i18nPrefix}.validation.codeDuplicate`));
    return;
  }
  const next = [...list.value];
  next[editingIdx.value] = { code, label };
  syncToParent(next);
  dialogVisible.value = false;
}

async function handleRemove(idx: number) {
  const row = list.value[idx];
  if (!row) return;
  try {
    await ElMessageBox.confirm(
      t(`${i18nPrefix}.deleteConfirm`, { name: row.label || row.code }),
      t(`${i18nPrefix}.deleteConfirmTitle`),
      {
        confirmButtonText: t(`${i18nPrefix}.confirm`),
        cancelButtonText: t(`${i18nPrefix}.cancel`),
        type: 'warning',
      },
    );
    const next = [...list.value];
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
        {{ t(`${i18nPrefix}.count`, { count: list.length }) }}
      </span>
    </div>
    <p class="mb-4 text-sm text-muted-foreground">
      {{ t(`${i18nPrefix}.hint`) }}
    </p>

    <div class="mb-4 flex flex-wrap gap-2">
      <ElInput
        v-model="newCode"
        :placeholder="t(`${i18nPrefix}.placeholder.code`)"
        style="width: 200px"
        @keyup.enter="handleAdd"
      />
      <ElInput
        v-model="newLabel"
        :placeholder="t(`${i18nPrefix}.placeholder.label`)"
        class="flex-1"
        @keyup.enter="handleAdd"
      />
      <ElButton type="primary" @click="handleAdd">
        {{ t(`${i18nPrefix}.add`) }}
      </ElButton>
    </div>

    <div class="rounded border border-border overflow-hidden">
      <ElTable
        :data="list"
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
          prop="code"
          :label="t(`${i18nPrefix}.column.code`)"
          min-width="180"
        />
        <ElTableColumn
          prop="label"
          :label="t(`${i18nPrefix}.column.label`)"
          min-width="220"
        />
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
      width="460px"
    >
      <div class="flex flex-col gap-3">
        <ElInput
          v-model="editCode"
          :placeholder="t(`${i18nPrefix}.placeholder.code`)"
        />
        <ElInput
          v-model="editLabel"
          :placeholder="t(`${i18nPrefix}.placeholder.label`)"
          @keyup.enter="submitEdit"
        />
      </div>
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
