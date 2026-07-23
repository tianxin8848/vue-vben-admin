<script lang="ts" setup>
import type { SystemSettingsApi } from '#/api';
import { reactive, watch } from 'vue';
import { ElButton, ElForm, ElFormItem, ElInput, ElMessage, ElOption, ElSelect } from 'element-plus';

const props = defineProps<{
  regions: string[];
  holidayCatalogs: SystemSettingsApi.RegionalHolidayCatalogItem[];
  message: string;
  messageType: '' | 'error' | 'success';
}>();

const emit = defineEmits<{
  (e: 'save', data: { region: string; holidayNames: string }): void;
  (e: 'update:message', value: string): void;
  (e: 'update:messageType', value: '' | 'error' | 'success'): void;
}>();

const catalogForm = reactive({
  region: props.regions[0] || '',
  holidayNames: '',
});

watch(() => props.regions, (newRegions) => {
  if (newRegions.length > 0 && !newRegions.includes(catalogForm.region)) {
    catalogForm.region = newRegions[0];
    fillCatalogEditor();
  }
}, { immediate: true });

function parseLineList(raw: string): string[] {
  return raw
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function findHolidayCatalogByRegion(region: string): null | SystemSettingsApi.RegionalHolidayCatalogItem {
  const regionKey = String(region || '').trim().toLowerCase();
  if (!regionKey) return null;
  return props.holidayCatalogs.find(
    (item) => String(item.region || '').trim().toLowerCase() === regionKey,
  ) || null;
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
  <div style="margin-top: 24px; padding-top: 24px; border-top: 1px solid #e2e8f0">
    <h3 style="margin: 0 0 12px; font-size: 18px">地区假期名称清单维护</h3>
    <p style="margin: 0 0 18px; color: #64748b">在这里维护“每个地区可选哪些假期名称”。这里的地区会严格和上方“地区列表”保持一致，地区假期录入下拉会直接读取这里的配置。</p>

    <ElForm label-width="100px">
      <ElFormItem label="地区">
        <ElSelect v-model="catalogForm.region" style="width: 140px" @change="fillCatalogEditor">
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
        <ElButton type="primary" @click="handleSave">保存地区假期名称清单</ElButton>
      </ElFormItem>
    </ElForm>

    <p style="color: #64748b; font-size: 12px; margin-top: 8px">建议每个地区都保留“其他”，便于录入临时假期或特殊安排。</p>
    <div
      v-if="message"
      style="margin-top: 12px; padding: 12px 14px; border-radius: 10px; white-space: pre-wrap;"
      :style="messageType === 'success' ? 'background: #dcfce7; color: #166534;' : 'background: #fee2e2; color: #991b1b;'"
    >
      {{ message }}
    </div>
  </div>
</template>