<script lang="ts" setup>
import type { SystemSettingsApi } from '#/api';

import { reactive, ref, watch } from 'vue';

import {
  ElAlert,
  ElButton,
  ElInput,
  ElMessage,
  ElOption,
  ElSelect,
  ElTag,
} from 'element-plus';

const props = defineProps<{
  holidayCatalogs: SystemSettingsApi.RegionalHolidayCatalogItem[];
  message: string;
  messageType: '' | 'error' | 'success';
  regions: string[];
}>();

const emit = defineEmits<{
  (e: 'save', data: { holidayNames: string; region: string }): void;
  (e: 'update:message', value: string): void;
  (e: 'update:messageType', value: '' | 'error' | 'success'): void;
}>();

const catalogForm = reactive({
  region: props.regions[0] || '',
  newHolidayName: '',
});

const holidayNameList = ref<string[]>([]);

watch(
  () => props.regions,
  (newRegions) => {
    if (newRegions.length > 0 && !newRegions.includes(catalogForm.region)) {
      catalogForm.region = newRegions[0] || '';
      fillCatalogEditor();
    }
  },
  { immediate: true },
);

function findHolidayCatalogByRegion(
  region: string,
): null | SystemSettingsApi.RegionalHolidayCatalogItem {
  const regionKey = String(region || '')
    .trim()
    .toLowerCase();
  if (!regionKey) return null;
  return (
    props.holidayCatalogs.find(
      (item) =>
        String(item.region || '')
          .trim()
          .toLowerCase() === regionKey,
    ) || null
  );
}

function fillCatalogEditor(region: string = catalogForm.region) {
  const matchedCatalog = findHolidayCatalogByRegion(region);
  holidayNameList.value = matchedCatalog
    ? [...(matchedCatalog.holiday_names || [])]
    : ['其他'];
}

watch(
  () => catalogForm.region,
  (region) => fillCatalogEditor(region),
);

function handleAddName() {
  const name = catalogForm.newHolidayName.trim();
  if (!name) {
    ElMessage.warning('请输入假期名称');
    return;
  }
  if (holidayNameList.value.includes(name)) {
    ElMessage.warning('该假期名称已存在');
    return;
  }
  holidayNameList.value.push(name);
  catalogForm.newHolidayName = '';
}

function handleRemoveName(idx: number) {
  holidayNameList.value.splice(idx, 1);
}

function handleSave() {
  if (!catalogForm.region) {
    ElMessage.warning('请选择地区');
    return;
  }
  if (holidayNameList.value.length === 0) {
    ElMessage.warning('请至少保留一个假期名称');
    return;
  }
  emit('save', {
    region: catalogForm.region,
    holidayNames: holidayNameList.value.join('\n'),
  });
}
</script>

<template>
  <section>
    <div class="mb-3 flex items-center justify-between">
      <h3 class="text-lg">地区假期名称清单维护</h3>
      <span class="text-sm text-muted-foreground">
        当前地区：{{ holidayNameList.length }} 个名称
      </span>
    </div>
    <p class="mb-4 text-sm text-muted-foreground">
      在这里维护“每个地区可选哪些假期名称”。地区假期录入下拉会直接读取这里的配置。
    </p>

    <div class="mb-4">
      <div class="text-sm text-muted-foreground mb-2">地区</div>
      <ElSelect
        v-model="catalogForm.region"
        class="w-full"
        @change="fillCatalogEditor"
      >
        <ElOption v-for="r in regions" :key="r" :label="r" :value="r" />
      </ElSelect>
    </div>

    <div class="mb-4 flex gap-2">
      <ElInput
        v-model="catalogForm.newHolidayName"
        placeholder="输入假期名称，如：元旦、春节"
        class="flex-1"
        @keyup.enter="handleAddName"
      />
      <ElButton type="primary" @click="handleAddName">新增名称</ElButton>
    </div>

    <div
      class="flex flex-wrap gap-2 rounded border border-border bg-muted/30 p-3 min-h-[100px]"
    >
      <template v-if="holidayNameList.length">
        <ElTag
          v-for="(name, idx) in holidayNameList"
          :key="idx"
          closable
          type="warning"
          effect="light"
          @close="handleRemoveName(idx)"
        >
          {{ name }}
        </ElTag>
      </template>
      <span v-else class="text-xs text-muted-foreground">
        暂无假期名称，请在上方新增
      </span>
    </div>

    <div class="mt-4 flex justify-end">
      <ElButton type="primary" @click="handleSave">
        保存地区假期名称清单
      </ElButton>
    </div>

    <p class="mt-2 text-xs text-muted-foreground">
      建议每个地区都保留“其他”，便于录入临时假期或特殊安排。
    </p>
    <ElAlert
      v-if="message"
      :title="message"
      :type="messageType === 'success' ? 'success' : 'error'"
      show-icon
      :closable="false"
      class="mt-3 whitespace-pre-wrap"
    />
  </section>
</template>
