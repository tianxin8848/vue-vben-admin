<script lang="ts" setup>
import type { VxeGridProps } from '#/adapter/vxe-table';
import type { SystemSettingsApi } from '#/api';

import { computed, ref, watch } from 'vue';

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
  type: string;
}

interface HolidayRow {
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

const holidayYearFilter = ref(new Date().getFullYear());

const summaryRows = computed<SummaryRow[]>(() => {
  const s = props.settings;
  if (!s) return [];
  return [
    {
      type: '部门',
      items: (s.departments || []).map((name) => ({ name })),
    },
    {
      type: '岗位',
      items: (s.positions || []).map((name) => ({ name })),
    },
    {
      type: '地区',
      items: (s.regions || []).map((name) => ({ name })),
    },
    {
      type: '模块',
      items: (s.modules || []).map((m) => ({
        code: m.module_code,
        name: m.module_name,
      })),
    },
    {
      type: '报销理由',
      items: (s.claim_reasons || []).map((r) => ({ name: r.name })),
    },
    {
      type: '币种与港币汇率',
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
      `确认删除 ${row.region} ${label} 的假期设置吗？`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      },
    );
    emit('deleteHoliday', row.start_date, row.end_date, row.region);
  } catch {}
}

const summaryGridOptions: VxeGridProps<SummaryRow> = {
  id: 'settings-preview-summary',
  rowConfig: { keyField: 'type' },
  columns: [
    { field: 'type', title: '类型', width: 140 },
    { title: '内容', minWidth: 280, slots: { default: 'content' } },
  ],
  proxyConfig: { enabled: false },
  toolbarConfig: { zoom: true, custom: false },
  customConfig: { storage: false },
};

const holidayGridOptions: VxeGridProps<HolidayRow> = {
  id: 'settings-preview-holiday',
  rowConfig: { keyField: 'start_date' },
  columns: [
    { field: 'region', title: '地区', width: 120 },
    { field: 'start_date', title: '开始日期', minWidth: 120 },
    { field: 'end_date', title: '结束日期', minWidth: 120 },
    { field: 'holiday_name', title: '假期名称', minWidth: 140 },
    { title: '操作', width: 90, fixed: 'right', slots: { default: 'action' } },
  ],
  proxyConfig: { enabled: false },
  toolbarConfig: { zoom: true, custom: false },
  customConfig: { storage: false },
};

const catalogGridOptions: VxeGridProps<CatalogRow> = {
  id: 'settings-preview-catalog',
  rowConfig: { keyField: 'region' },
  columns: [
    { field: 'region', title: '地区', width: 140 },
    {
      title: '假期名称清单',
      minWidth: 280,
      slots: { default: 'names' },
    },
  ],
  proxyConfig: { enabled: false },
  toolbarConfig: { zoom: true, custom: false },
  customConfig: { storage: false },
};

const [SummaryTable, summaryTableApi] = useVbenVxeGrid({
  gridOptions: summaryGridOptions,
});
const [HolidayTable, holidayTableApi] = useVbenVxeGrid({
  gridOptions: holidayGridOptions,
});
const [CatalogTable, catalogTableApi] = useVbenVxeGrid({
  gridOptions: catalogGridOptions,
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
  <ElCard header="当前预览">
    <p class="mb-4 text-sm text-muted-foreground">
      这些参数统一保存在一个 MongoDB 集合中，保存后新增员工页面会直接使用。
    </p>

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
            <template v-if="row.type === '模块'">
              {{ item.name }}（{{ item.code }}）
            </template>
            <template v-else-if="row.type === '币种与港币汇率'">
              {{ item.name }} → {{ item.rate }}
            </template>
            <template v-else>{{ item.name }}</template>
          </ElTag>
        </template>
        <span v-else class="text-xs text-muted-foreground">暂无</span>
      </template>
    </SummaryTable>

    <div class="mt-6 flex items-center justify-between">
      <span class="text-base font-semibold">地区假期</span>
      <ElSelect v-model="holidayYearFilter" size="small" class="w-28">
        <ElOption
          v-for="y in yearOptions"
          :key="y"
          :label="`${y}年`"
          :value="y"
        />
      </ElSelect>
    </div>
    <HolidayTable class="mt-2">
      <template #empty>
        <ElEmpty description="暂无地区假期配置" />
      </template>
      <template #action="{ row }">
        <ElButton
          size="small"
          type="danger"
          link
          @click="handleDeleteHoliday(row)"
        >
          删除
        </ElButton>
      </template>
    </HolidayTable>

    <div class="mt-6 mb-2 text-base font-semibold">地区假期名称清单</div>
    <CatalogTable>
      <template #empty>
        <ElEmpty description="暂无地区假期名称清单配置" />
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
  </ElCard>
</template>
