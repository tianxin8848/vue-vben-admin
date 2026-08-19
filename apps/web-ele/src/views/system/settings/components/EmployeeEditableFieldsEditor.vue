<script lang="ts" setup>
import type { SystemSettingsApi } from '#/api';

import { computed } from 'vue';

import { ElCheckbox, ElCheckboxGroup, ElEmpty } from 'element-plus';

const props = defineProps<{
  catalog: SystemSettingsApi.EmployeeEditableFieldItem[];
  modelValue: string[];
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: string[]): void;
}>();

interface CatalogGroup {
  fields: SystemSettingsApi.EmployeeEditableFieldItem[];
  name: string;
}

const groupedCatalog = computed<CatalogGroup[]>(() => {
  const map = new Map<string, SystemSettingsApi.EmployeeEditableFieldItem[]>();
  for (const item of props.catalog || []) {
    const group = item.group || '其他';
    if (!map.has(group)) map.set(group, []);
    const list = map.get(group);
    if (list) list.push(item);
  }
  return Array.from(map, ([name, fields]) => ({ name, fields }));
});

const selectedCodes = computed<string[]>(() => props.modelValue || []);

const isAllSelected = computed(
  () =>
    props.catalog.length > 0 &&
    selectedCodes.value.length === props.catalog.length,
);
const isIndeterminate = computed(
  () =>
    selectedCodes.value.length > 0 &&
    selectedCodes.value.length < props.catalog.length,
);

function handleGroupChange(value: (boolean | number | string)[]) {
  emit('update:modelValue', value.map(String));
}

function handleSelectAllToggle(value: boolean | number | string) {
  if (value) {
    emit(
      'update:modelValue',
      props.catalog.map((item) => item.code),
    );
  } else {
    emit('update:modelValue', []);
  }
}
</script>

<template>
  <section>
    <div class="mb-3 flex items-center justify-between">
      <h3 class="text-lg">员工可自编辑字段维护</h3>
      <span class="text-sm text-muted-foreground">
        已选 {{ selectedCodes.length }} / 共 {{ catalog.length }} 个字段
      </span>
    </div>
    <p class="mb-4 text-sm text-muted-foreground">
      勾选后员工可在员工工作台自行修改这些档案字段；未勾选的字段仅管理员可维护。
    </p>

    <div class="mb-3 flex gap-2">
      <ElCheckbox
        :model-value="isAllSelected"
        :indeterminate="isIndeterminate"
        @change="handleSelectAllToggle"
      >
        全选
      </ElCheckbox>
    </div>

    <ElCheckboxGroup
      :model-value="selectedCodes"
      class="grid grid-cols-2 gap-6"
      @change="handleGroupChange"
    >
      <div
        v-for="group in groupedCatalog"
        :key="group.name"
        class="rounded border p-3"
      >
        <div class="mb-2 text-sm font-semibold text-foreground">
          {{ group.name }}
        </div>
        <div class="grid grid-cols-2 gap-2 md:grid-cols-3">
          <ElCheckbox
            v-for="field in group.fields"
            :key="field.code"
            :value="field.code"
          >
            {{ field.label }}
          </ElCheckbox>
        </div>
      </div>
    </ElCheckboxGroup>

    <ElEmpty
      v-if="!catalog.length"
      description="暂无可配置字段目录"
      :image-size="60"
    />
  </section>
</template>
