<script lang="ts" setup>
import type { SystemSettingsApi } from '#/api';

import { reactive, watch } from 'vue';

import {
  ElButton,
  ElDatePicker,
  ElForm,
  ElFormItem,
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
  (e: 'save', data: SystemSettingsApi.RegionalHolidayRangeUpsert): void;
  (e: 'update:message', value: string): void;
  (e: 'update:messageType', value: '' | 'error' | 'success'): void;
}>();

const holidayForm = reactive({
  region: props.regions[0] ?? '',
  year: new Date().getFullYear(),
  startDate: '',
  endDate: '',
  holidayName: '',
});

watch(
  () => props.regions,
  (newRegions) => {
    if (newRegions.length > 0 && !newRegions.includes(holidayForm.region)) {
      holidayForm.region = newRegions[0] || '';
      buildHolidayNameOptions();
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

function resolveHolidayCatalogByRegion(region: string): string[] {
  const matchedCatalog = findHolidayCatalogByRegion(region);
  if (matchedCatalog && (matchedCatalog.holiday_names || []).length > 0) {
    return matchedCatalog.holiday_names;
  }
  return ['其他'];
}

function buildHolidayNameOptions(region: string = holidayForm.region) {
  const options = resolveHolidayCatalogByRegion(region);
  holidayForm.holidayName = options[0] || '';
}

function syncHolidayDatesToYear() {
  const yearText = String(holidayForm.year);
  const applyYear = (value: string) => {
    if (!value) return '';
    const parts = value.split('-');
    if (parts.length !== 3) return value;
    return `${yearText}-${parts[1]}-${parts[2]}`;
  };
  if (holidayForm.startDate) {
    holidayForm.startDate = applyYear(holidayForm.startDate);
  }
  if (holidayForm.endDate) {
    holidayForm.endDate = applyYear(holidayForm.endDate);
  }
}

function syncHolidayYearToDates() {
  const startValue = holidayForm.startDate;
  const endValue = holidayForm.endDate;
  const startYear = startValue ? startValue.split('-')[0] : '';
  const endYear = endValue ? endValue.split('-')[0] : '';

  if (startYear && (!endYear || endYear === startYear)) {
    holidayForm.year = Number(startYear);
  }
}

function handleSave() {
  if (
    !holidayForm.region ||
    !holidayForm.startDate ||
    !holidayForm.holidayName
  ) {
    ElMessage.warning('请填写完整假期信息');
    return;
  }
  emit('save', {
    region: holidayForm.region,
    start_date: holidayForm.startDate,
    end_date: holidayForm.endDate || undefined,
    holiday_name: holidayForm.holidayName,
  });
}

function initStartDate() {
  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  holidayForm.startDate = `${today.getFullYear()}-${month}-${day}`;
}

initStartDate();
</script>

<template>
  <div
    style="padding-top: 24px; margin-top: 24px; border-top: 1px solid #e2e8f0"
  >
    <h3 style="margin: 0 0 12px; font-size: 18px">地区假期维护</h3>
    <p style="margin: 0 0 18px; color: #64748b">
      在这里维护各个地区的节假日。可选择年份、日期区间（可只填一天）、假期名称和地区，保存后请假管理日历会直接读取。
    </p>

    <ElForm label-width="100px" inline>
      <ElFormItem label="地区">
        <ElSelect
          v-model="holidayForm.region"
          style="width: 140px"
          @change="buildHolidayNameOptions"
        >
          <ElOption v-for="r in regions" :key="r" :label="r" :value="r" />
        </ElSelect>
      </ElFormItem>
      <ElFormItem label="年份">
        <ElSelect
          v-model="holidayForm.year"
          style="width: 100px"
          @change="syncHolidayDatesToYear"
        >
          <ElOption
            v-for="y in Array.from({ length: 100 }, (_, i) => 2000 + i)"
            :key="y"
            :label="`${y}年`"
            :value="y"
          />
        </ElSelect>
      </ElFormItem>
      <ElFormItem label="开始日期">
        <ElDatePicker
          v-model="holidayForm.startDate"
          type="date"
          style="width: 140px"
          @change="syncHolidayYearToDates"
        />
      </ElFormItem>
      <ElFormItem label="结束日期">
        <ElDatePicker
          v-model="holidayForm.endDate"
          type="date"
          style="width: 140px"
          @change="syncHolidayYearToDates"
        />
      </ElFormItem>
      <ElFormItem label="假期名称">
        <ElSelect v-model="holidayForm.holidayName" style="width: 120px">
          <ElOption
            v-for="name in resolveHolidayCatalogByRegion(holidayForm.region)"
            :key="name"
            :label="name"
            :value="name"
          />
        </ElSelect>
      </ElFormItem>
      <ElFormItem>
        <ElButton type="primary" @click="handleSave">保存地区假期</ElButton>
      </ElFormItem>
    </ElForm>

    <p style="margin-top: 8px; font-size: 12px; color: #64748b">
      说明：同一地区同一天只保留一条假期记录；如果选择日期区间，会一次性写入多天并覆盖该区间内原有假期名称。
    </p>
    <div
      v-if="message"
      style="
        padding: 12px 14px;
        margin-top: 12px;
        white-space: pre-wrap;
        border-radius: 10px;
      "
      :style="
        messageType === 'success'
          ? 'background: #dcfce7; color: #166534;'
          : 'background: #fee2e2; color: #991b1b;'
      "
    >
      {{ message }}
    </div>
  </div>
</template>
