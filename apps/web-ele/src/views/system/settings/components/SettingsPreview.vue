<script lang="ts" setup>
import type { VxeGridProps } from '#/adapter/vxe-table';
import type { SystemSettingsApi } from '#/api';

import { computed, ref, watch } from 'vue';

import { useI18n } from '@vben/locales';

import {
  ElButton,
  ElCard,
  ElEmpty,
  ElMessageBox,
  ElOption,
  ElSelect,
  ElTag,
} from 'element-plus';

import { useVbenVxeGrid } from '#/adapter/vxe-table';

interface SummaryRow {
  items: { code?: string; name: string; rate?: number }[];
  typeKey: string;
  typeLabel: string;
}

interface HolidayRow {
  _key: string;
  end_date: string;
  holiday_name: string;
  region: string;
  start_date: string;
}

interface CatalogRow {
  holiday_names: string[];
  region: string;
}

const props = defineProps<{
  settings: null | SystemSettingsApi.SystemSettingsResponse;
}>();

const emit = defineEmits<{
  (
    e: 'deleteHoliday',
    startDate: string,
    endDate: string,
    region: string,
  ): void;
}>();

const { t } = useI18n();

const i18nPrefix = 'page.system.settingsDetail.settingsPreview';

const holidayYearFilter = ref(new Date().getFullYear());

const summaryRows = computed<SummaryRow[]>(() => {
  const s = props.settings;
  if (!s) return [];
  const fieldLabelMap = new Map<string, string>(
    (s.employee_profile_field_catalog || []).map((item) => [
      item.code,
      item.label,
    ]),
  );
  return [
    {
      typeKey: 'department',
      typeLabel: t(`${i18nPrefix}.typeDepartment`),
      items: (s.departments || []).map((name) => ({ name })),
    },
    {
      typeKey: 'position',
      typeLabel: t(`${i18nPrefix}.typePosition`),
      items: (s.positions || []).map((name) => ({ name })),
    },
    {
      typeKey: 'region',
      typeLabel: t(`${i18nPrefix}.typeRegion`),
      items: (s.regions || []).map((name) => ({ name })),
    },
    {
      typeKey: 'module',
      typeLabel: t(`${i18nPrefix}.typeModule`),
      items: (s.modules || []).map((m) => ({
        code: m.module_code,
        name: m.module_name,
      })),
    },
    {
      typeKey: 'editableFields',
      typeLabel: t(`${i18nPrefix}.typeEditableFields`),
      items: (s.employee_self_editable_fields || []).map((code) => ({
        code,
        name: fieldLabelMap.get(code) || code,
      })),
    },
    {
      typeKey: 'claimReason',
      typeLabel: t(`${i18nPrefix}.typeClaimReason`),
      items: (s.claim_reasons || []).map((r) => ({ name: r.name })),
    },
    {
      typeKey: 'currency',
      typeLabel: t(`${i18nPrefix}.typeCurrency`),
      items: (s.claim_currencies || []).map((c) => ({
        name: c.currency_code,
        rate: c.to_hkd_rate,
      })),
    },
  ];
});

const groupedHolidays = computed<HolidayRow[]>(() => {
  const items = props.settings?.regional_holidays || [];
  const year = String(holidayYearFilter.value);
  const filtered = items.filter((item) =>
    String(item.date || '').startsWith(`${year}-`),
  );

  const sorted = [...filtered].toSorted((left, right) => {
    const regionCompare = String(left.region || '').localeCompare(
      String(right.region || ''),
      'zh-CN',
    );
    if (regionCompare !== 0) return regionCompare;
    const holidayCompare = String(left.holiday_name || '').localeCompare(
      String(right.holiday_name || ''),
      'zh-CN',
    );
    if (holidayCompare !== 0) return holidayCompare;
    return String(left.date || '').localeCompare(String(right.date || ''));
  });

  const grouped: HolidayRow[] = [];
  const dateAddOne = (value: string) => {
    const dateObject = new Date(`${value}T00:00:00`);
    dateObject.setDate(dateObject.getDate() + 1);
    const y = dateObject.getFullYear();
    const m = String(dateObject.getMonth() + 1).padStart(2, '0');
    const d = String(dateObject.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  for (const item of sorted) {
    const region = String(item.region || '');
    const holidayName = String(item.holiday_name || '');
    const dateText = String(item.date || '');
    const last = grouped[grouped.length - 1];
    if (
      last &&
      last.region === region &&
      last.holiday_name === holidayName &&
      dateAddOne(last.end_date) === dateText
    ) {
      last.end_date = dateText;
      continue;
    }
    grouped.push({
      _key: `${region}|${holidayName}|${dateText}`,
      region,
      holiday_name: holidayName,
      start_date: dateText,
      end_date: dateText,
    });
  }

  return grouped;
});

const catalogRows = computed<CatalogRow[]>(() => {
  return (props.settings?.regional_holiday_catalogs || []).map((c) => ({
    holiday_names: c.holiday_names || [],
    region: c.region,
  }));
});

async function handleDeleteHoliday(row: HolidayRow) {
  const label =
    row.start_date === row.end_date
      ? row.start_date
      : `${row.start_date}/${row.end_date}`;
  try {
    await ElMessageBox.confirm(
      t(`${i18nPrefix}.deleteConfirm`, { region: row.region, date: label }),
      t(`${i18nPrefix}.deleteConfirmTitle`),
      {
        confirmButtonText: t(`${i18nPrefix}.confirm`),
        cancelButtonText: t(`${i18nPrefix}.cancel`),
        type: 'warning',
      },
    );
    emit('deleteHoliday', row.start_date, row.end_date, row.region);
  } catch {}
}

const summaryGridOptions = computed<VxeGridProps<SummaryRow>>(() => ({
  id: 'settings-preview-summary',
  rowConfig: { keyField: 'typeKey' },
  columns: [
    { field: 'typeLabel', title: t(`${i18nPrefix}.columnType`), width: 140 },
    {
      title: t(`${i18nPrefix}.columnContent`),
      minWidth: 280,
      slots: { default: 'content' },
    },
  ],
  proxyConfig: { enabled: false },
  toolbarConfig: { zoom: true, custom: false },
  customConfig: { storage: false },
}));

const holidayGridOptions = computed<VxeGridProps<HolidayRow>>(() => ({
  id: 'settings-preview-holiday',
  rowConfig: { keyField: '_key' },
  columns: [
    { field: 'region', title: t(`${i18nPrefix}.columnRegion`), width: 120 },
    {
      field: 'start_date',
      title: t(`${i18nPrefix}.columnStartDate`),
      minWidth: 120,
    },
    {
      field: 'end_date',
      title: t(`${i18nPrefix}.columnEndDate`),
      minWidth: 120,
    },
    {
      field: 'holiday_name',
      title: t(`${i18nPrefix}.columnHolidayName`),
      minWidth: 140,
    },
    {
      title: t(`${i18nPrefix}.columnAction`),
      width: 90,
      fixed: 'right',
      slots: { default: 'action' },
    },
  ],
  proxyConfig: { enabled: false },
  toolbarConfig: { zoom: true, custom: false },
  customConfig: { storage: false },
}));

const catalogGridOptions = computed<VxeGridProps<CatalogRow>>(() => ({
  id: 'settings-preview-catalog',
  rowConfig: { keyField: 'region' },
  columns: [
    { field: 'region', title: t(`${i18nPrefix}.columnRegion`), width: 140 },
    {
      title: t(`${i18nPrefix}.columnHolidayCatalog`),
      minWidth: 280,
      slots: { default: 'names' },
    },
  ],
  proxyConfig: { enabled: false },
  toolbarConfig: { zoom: true, custom: false },
  customConfig: { storage: false },
}));

const [SummaryTable, summaryTableApi] = useVbenVxeGrid({
  gridOptions: summaryGridOptions.value,
});
const [HolidayTable, holidayTableApi] = useVbenVxeGrid({
  gridOptions: holidayGridOptions.value,
});
const [CatalogTable, catalogTableApi] = useVbenVxeGrid({
  gridOptions: catalogGridOptions.value,
});

watch(summaryGridOptions, (opts) => {
  summaryTableApi.setGridOptions(opts);
});
watch(holidayGridOptions, (opts) => {
  holidayTableApi.setGridOptions(opts);
});
watch(catalogGridOptions, (opts) => {
  catalogTableApi.setGridOptions(opts);
});

watch(
  summaryRows,
  (rows) => {
    summaryTableApi.setGridOptions({ data: rows });
  },
  { immediate: true, deep: true },
);

watch(
  groupedHolidays,
  (rows) => {
    holidayTableApi.setGridOptions({ data: rows });
  },
  { immediate: true, deep: true },
);

watch(
  catalogRows,
  (rows) => {
    catalogTableApi.setGridOptions({ data: rows });
  },
  { immediate: true, deep: true },
);

const yearOptions = Array.from({ length: 61 }, (_, i) => 2000 + i);
</script>

<template>
  <ElCard :header="t(`${i18nPrefix}.cardTitle`)">
    <p class="mb-4 text-sm text-muted-foreground">
      {{ t(`${i18nPrefix}.hint`) }}
    </p>

    <div class="grid grid-cols-2 gap-6">
      <!-- 左列：汇总表 -->
      <SummaryTable>
        <template #content="{ row }">
          <template v-if="row.items.length">
            <ElTag
              v-for="(item, idx) in row.items"
              :key="idx"
              size="small"
              type="info"
              class="mr-1 mb-1"
            >
              <template v-if="row.typeKey === 'module'">
                {{ item.name }}（{{ item.code }}）
              </template>
              <template v-else-if="row.typeKey === 'editableFields'">
                {{ item.name }}（{{ item.code }}）
              </template>
              <template v-else-if="row.typeKey === 'currency'">
                {{ item.name }} → {{ item.rate }}
              </template>
              <template v-else>{{ item.name }}</template>
            </ElTag>
          </template>
          <span v-else class="text-xs text-muted-foreground">
            {{ t(`${i18nPrefix}.empty`) }}
          </span>
        </template>
      </SummaryTable>

      <!-- 右列：地区假期表 -->
      <div class="flex flex-col gap-2">
        <div class="flex items-center justify-between">
          <span class="text-base font-semibold">
            {{ t(`${i18nPrefix}.sectionHoliday`) }}
          </span>
          <ElSelect v-model="holidayYearFilter" size="small" class="w-28">
            <ElOption
              v-for="y in yearOptions"
              :key="y"
              :label="t(`${i18nPrefix}.yearSuffix`, { year: y })"
              :value="y"
            />
          </ElSelect>
        </div>
        <HolidayTable>
          <template #empty>
            <ElEmpty :description="t(`${i18nPrefix}.emptyHoliday`)" />
          </template>
          <template #action="{ row }">
            <ElButton
              size="small"
              type="danger"
              link
              @click="handleDeleteHoliday(row as HolidayRow)"
            >
              {{ t(`${i18nPrefix}.delete`) }}
            </ElButton>
          </template>
        </HolidayTable>
      </div>

      <!-- 第二行：地区假期名称清单（跨两列，表格内容较宽） -->
      <div class="col-span-2 flex flex-col gap-2">
        <div class="text-base font-semibold">
          {{ t(`${i18nPrefix}.sectionHolidayCatalog`) }}
        </div>
        <CatalogTable>
          <template #empty>
            <ElEmpty :description="t(`${i18nPrefix}.emptyHolidayCatalog`)" />
          </template>
          <template #names="{ row }">
            <ElTag
              v-for="(name, idx) in row.holiday_names"
              :key="idx"
              size="small"
              class="mr-1 mb-1"
            >
              {{ name }}
            </ElTag>
            <span
              v-if="!row.holiday_names.length"
              class="text-xs text-muted-foreground"
              >-</span>
          </template>
        </CatalogTable>
      </div>
    </div>
  </ElCard>
</template>
