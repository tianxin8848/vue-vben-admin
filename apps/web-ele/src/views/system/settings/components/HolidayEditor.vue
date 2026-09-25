<script lang="ts" setup>
import type { SystemSettingsApi } from '#/api';

import { computed, reactive, watch } from 'vue';

import { useI18n } from '@vben/locales';

import {
  ElAlert,
  ElButton,
  ElDatePicker,
  ElEmpty,
  ElOption,
  ElSelect,
  ElTable,
  ElTableColumn,
  ElTag,
} from 'element-plus';

import { toastWarning } from '#/utils/message';
import { normalizeRegionKey, regionsMatch } from '#/utils/regions';

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

const { t } = useI18n();

const holidayForm = reactive({
  region: props.regions[0] ?? '',
  year: new Date().getFullYear(),
  startDate: '',
  endDate: '',
  holidayName: '',
});

const previewRows = computed<HolidayPreviewRow[]>(() => {
  const year = String(holidayForm.year);
  // 地区宽松匹配：「香港」=「HK」=「Hong Kong」，与后端模板口径一致
  return (props.holidays || [])
    .filter((item) => {
      return (
        String(item.date || '').startsWith(`${year}-`) &&
        regionsMatch(item.region, holidayForm.region)
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
  if (!normalizeRegionKey(region)) return null;
  return (
    props.holidayCatalogs.find((item) => regionsMatch(item.region, region)) ??
    null
  );
}

function resolveHolidayCatalogByRegion(region: string): string[] {
  const matchedCatalog = findHolidayCatalogByRegion(region);
  if (matchedCatalog && (matchedCatalog.holiday_names || []).length > 0) {
    return matchedCatalog.holiday_names;
  }
  return [t('page.system.settingsDetail.holidayEditor.otherHolidayName')];
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
    toastWarning(t('page.system.settingsDetail.holidayEditor.formIncomplete'));
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
      <h3 class="text-lg">
        {{ t('page.system.settingsDetail.holidayEditor.title') }}
      </h3>
      <span class="text-sm text-muted-foreground">
        {{
          holidayForm.region
            ? t('page.system.settingsDetail.holidayEditor.regionYearSuffix', {
                region: holidayForm.region,
                year: holidayForm.year,
              })
            : ''
        }}
      </span>
    </div>
    <p class="mb-4 text-sm text-muted-foreground">
      {{ t('page.system.settingsDetail.holidayEditor.hint') }}
    </p>

    <div class="grid grid-cols-2 gap-3 mb-3">
      <div>
        <div class="text-sm text-muted-foreground mb-1">
          {{ t('page.system.settingsDetail.holidayEditor.regionLabel') }}
        </div>
        <ElSelect
          v-model="holidayForm.region"
          style="width: 100%"
          @change="buildHolidayNameOptions"
        >
          <ElOption v-for="r in regions" :key="r" :label="r" :value="r" />
        </ElSelect>
      </div>
      <div>
        <div class="text-sm text-muted-foreground mb-1">
          {{ t('page.system.settingsDetail.holidayEditor.yearLabel') }}
        </div>
        <ElSelect
          v-model="holidayForm.year"
          style="width: 100%"
          @change="syncHolidayDatesToYear"
        >
          <ElOption
            v-for="y in Array.from({ length: 100 }, (_, i) => 2000 + i)"
            :key="y"
            :label="
              t('page.system.settingsDetail.holidayEditor.yearSuffix', {
                year: y,
              })
            "
            :value="y"
          />
        </ElSelect>
      </div>
      <div>
        <div class="text-sm text-muted-foreground mb-1">
          {{ t('page.system.settingsDetail.holidayEditor.startDateLabel') }}
        </div>
        <ElDatePicker
          v-model="holidayForm.startDate"
          type="date"
          style="width: 100%"
          @change="syncHolidayYearToDates"
        />
      </div>
      <div>
        <div class="text-sm text-muted-foreground mb-1">
          {{ t('page.system.settingsDetail.holidayEditor.endDateLabel') }}
        </div>
        <ElDatePicker
          v-model="holidayForm.endDate"
          type="date"
          style="width: 100%"
          @change="syncHolidayYearToDates"
        />
      </div>
      <div class="col-span-2">
        <div class="text-sm text-muted-foreground mb-1">
          {{ t('page.system.settingsDetail.holidayEditor.holidayNameLabel') }}
        </div>
        <div class="flex gap-2">
          <ElSelect v-model="holidayForm.holidayName" class="flex-1">
            <ElOption
              v-for="name in resolveHolidayCatalogByRegion(holidayForm.region)"
              :key="name"
              :label="name"
              :value="name"
            />
          </ElSelect>
          <ElButton type="primary" @click="handleSave">
            {{ t('page.system.settingsDetail.holidayEditor.saveButton') }}
          </ElButton>
        </div>
      </div>
    </div>

    <p class="mb-3 text-xs text-muted-foreground">
      {{ t('page.system.settingsDetail.holidayEditor.noteHint') }}
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
          {{
            t('page.system.settingsDetail.holidayEditor.previewTitle', {
              year: holidayForm.year,
            })
          }}
        </span>
        <ElTag type="info" effect="plain" size="small">
          {{
            t('page.system.settingsDetail.holidayEditor.dayCount', {
              count: previewRows.length,
            })
          }}
        </ElTag>
      </div>
      <ElTable
        :data="previewRows"
        size="small"
        stripe
        style="width: 100%"
        empty-text=""
      >
        <ElTableColumn
          type="index"
          :label="t('page.system.settingsDetail.holidayEditor.columnIndex')"
          width="60"
          align="center"
        />
        <ElTableColumn
          prop="date"
          :label="t('page.system.settingsDetail.holidayEditor.columnDate')"
          min-width="130"
        />
        <ElTableColumn
          :label="
            t('page.system.settingsDetail.holidayEditor.columnHolidayName')
          "
          min-width="140"
        >
          <template #default="{ row }">
            <ElTag type="danger" effect="light">
              {{ row.holiday_name }}
            </ElTag>
          </template>
        </ElTableColumn>
        <template #empty>
          <ElEmpty
            :description="t('page.system.settingsDetail.holidayEditor.empty')"
            :image-size="60"
          />
        </template>
      </ElTable>
    </div>
  </section>
</template>
