<script lang="ts" setup>
import type { SystemSettingsApi } from '#/api';

import { reactive, watch } from 'vue';

import {
  ElAlert,
  ElButton,
  ElForm,
  ElFormItem,
  ElInput,
  ElMessage,
  ElOption,
  ElSelect,
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
  holidayNames: '',
});

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
  catalogForm.holidayNames = matchedCatalog
    ? (matchedCatalog.holiday_names || []).join('\n')
    : '其他';
}

function handleSave() {
  if (!catalogForm.region) {
    ElMessage.warning('请选择地区');
    return;
  }
  emit('save', {
    region: catalogForm.region,
    holidayNames: catalogForm.holidayNames,
  });
}
</script>

<template>
  <section class="mt-6 border-t border-border pt-6">
    <h3 class="mb-3 text-lg">地区假期名称清单维护</h3>
    <p class="mb-4 text-sm text-muted-foreground">
      在这里维护“每个地区可选哪些假期名称”。这里的地区会严格和上方“地区列表”保持一致，地区假期录入下拉会直接读取这里的配置。
    </p>

    <ElForm label-width="100px">
      <ElFormItem label="地区">
        <ElSelect
          v-model="catalogForm.region"
          class="w-[140px]"
          @change="fillCatalogEditor"
        >
          <ElOption v-for="r in regions" :key="r" :label="r" :value="r" />
        </ElSelect>
      </ElFormItem>
      <ElFormItem label="假期名称列表">
        <ElInput
          v-model="catalogForm.holidayNames"
          type="textarea"
          :rows="4"
          placeholder="一行一个假期名称，例如：&#10;元旦&#10;春节&#10;国庆节&#10;其他"
        />
      </ElFormItem>
      <ElFormItem>
        <ElButton type="primary" @click="handleSave">
          保存地区假期名称清单
        </ElButton>
      </ElFormItem>
    </ElForm>

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
