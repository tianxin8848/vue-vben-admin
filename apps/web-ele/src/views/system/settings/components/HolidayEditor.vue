<script lang="ts" setup>
import type { SystemSettingsApi } from '#/api';

import { computed, reactive, watch } from 'vue';

import {
  ElAlert,
  ElButton,
  ElDatePicker,
  ElEmpty,
  ElMessage,
  ElOption,
  ElSelect,
  ElTable,
  ElTableColumn,
  ElTag,
} from 'element-plus';

interface HolidayPreviewRow {
  _key: string;
  date: string;
  holiday_name: string;
}

const props = defineProps<{
  holidayCatalogs: SystemSettingsApi.RegionalHolidayCatalogItem[];
  holidays: SystemSettingsApi.RegionalHolidayItem[];
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

const previewRows = computed<HolidayPreviewRow[]>(() => {
  const year = String(holidayForm.year);
  const region = String(holidayForm.region || '')
    .trim()
    .toLowerCase();
  return (props.holidays || [])
    .filter((item) => {
      return (
        String(item.date || '').startsWith(`${year}-`) &&
        String(item.region || '')
          .trim()
          .toLowerCase() === region
      );
    })
    .toSorted((a, b) =>
      String(a.date || '').localeCompare(String(b.date || '')),
    )
    .map((item) => ({
      _key: `${item.region}|${item.date}|${item.holiday_name}`,
      date: item.date,
      holiday_name: item.holiday_name,
    }));
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
  <section>
    <div class="mb-3 flex items-center justify-between">
      <h3 class="text-lg">地区假期维护</h3>
      <span class="text-sm text-muted-foreground">
        {{
          holidayForm.region
            ? `${holidayForm.region} · ${holidayForm.year}年`
            : ''
        }}
      </span>
    </div>
    <p class="mb-4 text-sm text-muted-foreground">
      在这里维护各个地区的节假日。可选择年份、日期区间（可只填一天）、假期名称和地区，保存后请假管理日历会直接读取。
    </p>

    <div class="grid grid-cols-2 gap-3 mb-3">
      <div>
        <div class="text-sm text-muted-foreground mb-1">地区</div>
        <ElSelect
          v-model="holidayForm.region"
          style="width: 100%"
          @change="buildHolidayNameOptions"
        >
          <ElOption v-for="r in regions" :key="r" :label="r" :value="r" />
        </ElSelect>
      </div>
      <div>
        <div class="text-sm text-muted-foreground mb-1">年份</div>
        <ElSelect
          v-model="holidayForm.year"
          style="width: 100%"
          @change="syncHolidayDatesToYear"
        >
          <ElOption
            v-for="y in Array.from({ length: 100 }, (_, i) => 2000 + i)"
            :key="y"
            :label="`${y}年`"
            :value="y"
          />
        </ElSelect>
      </div>
      <div>
        <div class="text-sm text-muted-foreground mb-1">开始日期</div>
        <ElDatePicker
          v-model="holidayForm.startDate"
          type="date"
          style="width: 100%"
          @change="syncHolidayYearToDates"
        />
      </div>
      <div>
        <div class="text-sm text-muted-foreground mb-1">结束日期</div>
        <ElDatePicker
          v-model="holidayForm.endDate"
          type="date"
          style="width: 100%"
          @change="syncHolidayYearToDates"
        />
      </div>
      <div class="col-span-2">
        <div class="text-sm text-muted-foreground mb-1">假期名称</div>
        <div class="flex gap-2">
          <ElSelect v-model="holidayForm.holidayName" class="flex-1">
            <ElOption
              v-for="name in resolveHolidayCatalogByRegion(holidayForm.region)"
              :key="name"
              :label="name"
              :value="name"
            />
          </ElSelect>
          <ElButton type="primary" @click="handleSave">保存地区假期</ElButton>
        </div>
      </div>
    </div>

    <p class="mb-3 text-xs text-muted-foreground">
      说明：同一地区同一天只保留一条假期记录；如果选择日期区间，会一次性写入多天并覆盖该区间内原有假期名称。
    </p>

    <ElAlert
      v-if="message"
      :title="message"
      :type="messageType === 'success' ? 'success' : 'error'"
      show-icon
      :closable="false"
      class="mb-3 whitespace-pre-wrap"
    />

    <div class="rounded border border-border overflow-hidden">
      <div
        class="px-4 py-2 bg-muted/40 border-b border-border flex items-center justify-between"
      >
        <span class="text-sm font-semibold">
          当前地区 · {{ holidayForm.year }}年 已配置假期
        </span>
        <ElTag type="info" effect="plain" size="small">
          {{ previewRows.length }} 天
        </ElTag>
      </div>
      <ElTable
        :data="previewRows"
        size="small"
        stripe
        style="width: 100%"
        empty-text=""
      >
        <ElTableColumn type="index" label="序号" width="60" align="center" />
        <ElTableColumn prop="date" label="日期" min-width="130" />
        <ElTableColumn label="假期名称" min-width="140">
          <template #default="{ row }">
            <ElTag type="danger" effect="light">
              {{ row.holiday_name }}
            </ElTag>
          </template>
        </ElTableColumn>
        <template #empty>
          <ElEmpty description="该地区本年暂无假期配置" :image-size="60" />
        </template>
      </ElTable>
    </div>
  </section>
</template>
