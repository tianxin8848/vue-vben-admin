<script lang="ts" setup>
import type { SystemSettingsApi } from '#/api';
import { computed, ref } from 'vue';
import { ElButton, ElOption, ElSelect, ElTable, ElTableColumn, ElTag } from 'element-plus';

const props = defineProps<{
  settings: null | SystemSettingsApi.SystemSettingsResponse;
}>();

const emit = defineEmits<{
  (e: 'deleteHoliday', startDate: string, endDate: string, region: string): void;
}>();

const holidayYearFilter = ref(new Date().getFullYear());

const groupedHolidays = computed(() => {
  const items = props.settings?.regional_holidays || [];
  const year = String(holidayYearFilter.value);
  const filtered = items.filter((item) => String(item.date || '').startsWith(year + '-'));

  const sorted = [...filtered].sort((left, right) => {
    const regionCompare = String(left.region || '').localeCompare(String(right.region || ''), 'zh-CN');
    if (regionCompare !== 0) return regionCompare;
    const holidayCompare = String(left.holiday_name || '').localeCompare(String(right.holiday_name || ''), 'zh-CN');
    if (holidayCompare !== 0) return holidayCompare;
    return String(left.date || '').localeCompare(String(right.date || ''));
  });

  const grouped: { end_date: string; holiday_name: string; region: string; start_date: string; }[] = [];
  const dateAddOne = (value: string) => {
    const dateObject = new Date(`${value}T00:00:00`);
    dateObject.setDate(dateObject.getDate() + 1);
    const year = dateObject.getFullYear();
    const month = String(dateObject.getMonth() + 1).padStart(2, '0');
    const day = String(dateObject.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
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

function handleDeleteHoliday(startDate: string, endDate: string, region: string) {
  const label = startDate === endDate ? startDate : `${startDate}/${endDate}`;
  if (!confirm(`确认删除 ${region} ${label} 的假期设置吗？`)) return;
  emit('deleteHoliday', startDate, endDate, region);
}
</script>

<template>
  <ElCard header="当前预览">
    <p style="color: #64748b; margin-bottom: 20px">这些参数统一保存在一个 MongoDB 集合中，保存后新增员工页面会直接使用。</p>

    <div style="margin-bottom: 20px">
      <div style="font-weight: 700; margin-bottom: 10px">部门</div>
      <div style="display: flex; flex-wrap: wrap; gap: 8px">
        <ElTag v-for="d in settings?.departments" :key="d" type="primary" size="small">{{ d }}</ElTag>
        <span v-if="!settings?.departments?.length" style="color: #64748b; font-size: 13px">暂无部门配置</span>
      </div>
    </div>

    <div style="margin-bottom: 20px">
      <div style="font-weight: 700; margin-bottom: 10px">岗位</div>
      <div style="display: flex; flex-wrap: wrap; gap: 8px">
        <ElTag v-for="p in settings?.positions" :key="p" type="primary" size="small">{{ p }}</ElTag>
        <span v-if="!settings?.positions?.length" style="color: #64748b; font-size: 13px">暂无岗位配置</span>
      </div>
    </div>

    <div style="margin-bottom: 20px">
      <div style="font-weight: 700; margin-bottom: 10px">地区</div>
      <div style="display: flex; flex-wrap: wrap; gap: 8px">
        <ElTag v-for="r in settings?.regions" :key="r" type="primary" size="small">{{ r }}</ElTag>
        <span v-if="!settings?.regions?.length" style="color: #64748b; font-size: 13px">暂无地区配置</span>
      </div>
    </div>

    <div style="margin-bottom: 20px">
      <div style="font-weight: 700; margin-bottom: 10px">模块</div>
      <ElTable :data="settings?.modules || []" size="small" border>
        <ElTableColumn prop="module_code" label="模块编码" />
        <ElTableColumn prop="module_name" label="模块名称" />
        <template #empty>
          <span style="color: #64748b">暂无模块配置</span>
        </template>
      </ElTable>
    </div>

    <div style="margin-bottom: 20px">
      <div style="font-weight: 700; margin-bottom: 10px">报销理由</div>
      <div style="display: flex; flex-wrap: wrap; gap: 8px">
        <ElTag v-for="cr in settings?.claim_reasons?.map((r) => r.name)" :key="cr" type="info" size="small">{{ cr }}</ElTag>
        <span v-if="!settings?.claim_reasons?.length" style="color: #64748b; font-size: 13px">暂无报销理由配置</span>
      </div>
    </div>

    <div style="margin-bottom: 20px">
      <div style="font-weight: 700; margin-bottom: 10px">币种与港币汇率</div>
      <ElTable :data="settings?.claim_currencies || []" size="small" border>
        <ElTableColumn prop="currency_code" label="币种" />
        <ElTableColumn prop="to_hkd_rate" label="汇率" />
        <template #empty>
          <span style="color: #64748b">暂无币种配置</span>
        </template>
      </ElTable>
    </div>

    <div style="margin-bottom: 20px">
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px">
        <div style="font-weight: 700">地区假期</div>
        <ElSelect v-model="holidayYearFilter" style="width: 100px" size="small">
          <ElOption v-for="y in Array.from({ length: 100 }, (_, i) => 2000 + i)" :key="y" :label="`${y }年`" :value="y" />
        </ElSelect>
      </div>
      <ElTable :data="groupedHolidays" size="small" border>
        <ElTableColumn prop="region" label="地区" />
        <ElTableColumn label="日期">
          <template #default="{ row }">{{ row.start_date === row.end_date ? row.start_date : `${row.start_date}/${row.end_date}` }}</template>
        </ElTableColumn>
        <ElTableColumn prop="holiday_name" label="假期名称" />
        <ElTableColumn label="操作" width="80">
          <template #default="{ row }">
            <ElButton size="small" type="danger" @click="handleDeleteHoliday(row.start_date, row.end_date, row.region)">删除</ElButton>
          </template>
        </ElTableColumn>
        <template #empty>
          <span style="color: #64748b">暂无地区假期配置</span>
        </template>
      </ElTable>
    </div>

    <div>
      <div style="font-weight: 700; margin-bottom: 10px">地区假期名称清单</div>
      <ElTable :data="settings?.regional_holiday_catalogs || []" size="small" border>
        <ElTableColumn prop="region" label="地区" />
        <ElTableColumn label="假期名称列表">
          <template #default="{ row }">{{ (row.holiday_names || []).join(' / ') || '-' }}</template>
        </ElTableColumn>
        <template #empty>
          <span style="color: #64748b">暂无地区假期名称清单配置</span>
        </template>
      </ElTable>
    </div>
  </ElCard>
</template>
