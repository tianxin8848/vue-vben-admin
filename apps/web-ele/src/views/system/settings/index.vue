<script lang="ts" setup>
import type { SystemSettingsApi } from '#/api';

import { computed, onMounted, reactive, ref } from 'vue';

import {
  ElButton,
  ElCard,
  ElCheckbox,
  ElDatePicker,
  ElForm,
  ElFormItem,
  ElInput,
  ElMessage,
  ElOption,
  ElSelect,
  ElTable,
  ElTableColumn,
  ElTag,
} from 'element-plus';

import {
  deleteRegionalHolidayRangeApi,
  getSystemSettingsApi,
  updateSystemSettingsApi,
  upsertRegionalHolidayRangeApi,
} from '#/api';

const loading = ref(false);
const settings = ref<null | SystemSettingsApi.SystemSettingsResponse>(null);

const deptStr = ref('');
const posStr = ref('');
const regionStr = ref('');
const claimReasonsStr = ref('');
const claimCurrenciesStr = ref('');

const selectedModules = ref<Set<string>>(new Set());
const modulesSummary = computed(() => `已选择 ${selectedModules.value.size} 个模块`);

const holidayForm = reactive({
  region: '',
  year: new Date().getFullYear(),
  startDate: '',
  endDate: '',
  holidayName: '',
});

const catalogForm = reactive({
  region: '',
  holidayNames: '',
});

const holidayYearFilter = ref(new Date().getFullYear());

const formMessage = ref('');
const formMessageType = ref<'success' | 'error' | ''>('');
const holidayMessage = ref('');
const holidayMessageType = ref<'success' | 'error' | ''>('');
const catalogMessage = ref('');
const catalogMessageType = ref<'success' | 'error' | ''>('');

function showFormMessage(type: 'success' | 'error', text: string) {
  formMessageType.value = type;
  formMessage.value = text;
}

function showHolidayMessage(type: 'success' | 'error', text: string) {
  holidayMessageType.value = type;
  holidayMessage.value = text;
}

function showCatalogMessage(type: 'success' | 'error', text: string) {
  catalogMessageType.value = type;
  catalogMessage.value = text;
}

function parseLineList(raw: string): string[] {
  return raw
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseClaimCurrencies(raw: string): SystemSettingsApi.ClaimCurrencyItem[] {
  return raw
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => {
      const [currencyCode, rateText] = item.split(',').map((part) => part.trim());
      return {
        currency_code: (currencyCode || '').toUpperCase(),
        to_hkd_rate: Number(rateText),
      };
    })
    .filter(
      (item) =>
        item.currency_code && Number.isFinite(item.to_hkd_rate) && item.to_hkd_rate > 0,
    );
}

function findHolidayCatalogByRegion(region: string): SystemSettingsApi.RegionalHolidayCatalogItem | null {
  const regionKey = String(region || '').trim().toLowerCase();
  if (!regionKey) return null;
  return (settings.value?.regional_holiday_catalogs || []).find(
    (item) => String(item.region || '').trim().toLowerCase() === regionKey,
  ) || null;
}

function resolveHolidayCatalogByRegion(region: string): string[] {
  const matchedCatalog = findHolidayCatalogByRegion(region);
  if (matchedCatalog && (matchedCatalog.holiday_names || []).length) {
    return matchedCatalog.holiday_names;
  }
  return ['其他'];
}

function buildHolidayNameOptions(region: string = holidayForm.region) {
  const options = resolveHolidayCatalogByRegion(region);
  holidayForm.holidayName = options[0] || '';
}

function fillCatalogEditor(region: string) {
  const matchedCatalog = findHolidayCatalogByRegion(region);
  catalogForm.holidayNames = matchedCatalog
    ? (matchedCatalog.holiday_names || []).join('\n')
    : '其他';
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

const groupedHolidays = computed(() => {
  const items = settings.value?.regional_holidays || [];
  const year = String(holidayYearFilter.value);
  const filtered = items.filter((item) => String(item.date || '').startsWith(year + '-'));

  const sorted = [...filtered].sort((left, right) => {
    const regionCompare = String(left.region || '').localeCompare(String(right.region || ''), 'zh-CN');
    if (regionCompare !== 0) return regionCompare;
    const holidayCompare = String(left.holiday_name || '').localeCompare(String(right.holiday_name || ''), 'zh-CN');
    if (holidayCompare !== 0) return holidayCompare;
    return String(left.date || '').localeCompare(String(right.date || ''));
  });

  const grouped: { region: string; holiday_name: string; start_date: string; end_date: string }[] = [];
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

async function fetchSettings() {
  loading.value = true;
  try {
    settings.value = await getSystemSettingsApi();
    if (settings.value) {
      deptStr.value = settings.value.departments.join('\n');
      posStr.value = settings.value.positions.join('\n');
      regionStr.value = settings.value.regions.join('\n');
      claimReasonsStr.value = (settings.value.claim_reasons || []).map((item) => item.name || '').filter(Boolean).join('\n');
      claimCurrenciesStr.value = (settings.value.claim_currencies || []).map((item) => `${item.currency_code || ''},${item.to_hkd_rate || ''}`).join('\n');

      selectedModules.value = new Set(settings.value.modules.map((m) => m.module_code));

      if (settings.value.regions.length > 0) {
        holidayForm.region = settings.value.regions[0];
        catalogForm.region = settings.value.regions[0];
      }
      buildHolidayNameOptions(holidayForm.region);
      fillCatalogEditor(catalogForm.region);

      const today = new Date();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      holidayForm.startDate = `${today.getFullYear()}-${month}-${day}`;
    }
  } finally {
    loading.value = false;
  }
}

async function handleSaveSettings() {
  try {
    const data: SystemSettingsApi.SystemSettingsUpdate = {
      departments: parseLineList(deptStr.value),
      positions: parseLineList(posStr.value),
      regions: parseLineList(regionStr.value),
      modules: (settings.value?.modules || [])
        .filter((m) => selectedModules.value.has(m.module_code))
        .map((m) => ({ module_code: m.module_code, module_name: m.module_name })),
      claim_reasons: parseLineList(claimReasonsStr.value).map((name) => ({ name })),
      claim_currencies: parseClaimCurrencies(claimCurrenciesStr.value),
      regional_holidays: settings.value?.regional_holidays || [],
      regional_holiday_catalogs: settings.value?.regional_holiday_catalogs || [],
    };
    settings.value = await updateSystemSettingsApi(data);
    showFormMessage('success', '保存成功');
    fetchSettings();
  } catch (error: any) {
    showFormMessage('error', error.message || '保存失败');
  }
}

async function handleSaveHoliday() {
  if (!holidayForm.region || !holidayForm.startDate || !holidayForm.holidayName) {
    ElMessage.warning('请填写完整假期信息');
    return;
  }
  try {
    const data: SystemSettingsApi.RegionalHolidayRangeUpsert = {
      region: holidayForm.region,
      start_date: holidayForm.startDate,
      end_date: holidayForm.endDate || undefined,
      holiday_name: holidayForm.holidayName,
    };
    settings.value = await upsertRegionalHolidayRangeApi(data);
    showHolidayMessage('success', '地区假期已保存');
    fetchSettings();
  } catch (error: any) {
    showHolidayMessage('error', error.message || '保存失败');
  }
}

async function handleSaveCatalog() {
  if (!catalogForm.region) {
    ElMessage.warning('请选择地区');
    return;
  }
  try {
    const catalogs = settings.value?.regional_holiday_catalogs || [];
    const existingIndex = catalogs.findIndex(
      (c) => c.region.toLowerCase() === catalogForm.region.toLowerCase(),
    );
    const updatedCatalogs = [...catalogs];
    if (existingIndex >= 0) {
      updatedCatalogs[existingIndex] = {
        region: catalogForm.region,
        holiday_names: parseLineList(catalogForm.holidayNames),
      };
    } else {
      updatedCatalogs.push({
        region: catalogForm.region,
        holiday_names: parseLineList(catalogForm.holidayNames),
      });
    }

    const data: SystemSettingsApi.SystemSettingsUpdate = {
      regional_holiday_catalogs: updatedCatalogs,
    };
    settings.value = await updateSystemSettingsApi(data);
    showCatalogMessage('success', '地区假期名称清单已保存');
    fetchSettings();
  } catch (error: any) {
    showCatalogMessage('error', error.message || '保存失败');
  }
}

async function handleDeleteHoliday(startDate: string, endDate: string, region: string) {
  const label = startDate === endDate ? startDate : `${startDate}/${endDate}`;
  if (!confirm(`确认删除 ${region} ${label} 的假期设置吗？`)) return;

  try {
    const data: SystemSettingsApi.RegionalHolidayRangeDelete = {
      region,
      start_date: startDate,
      end_date: endDate || undefined,
    };
    settings.value = await deleteRegionalHolidayRangeApi(data);
    showHolidayMessage('success', '地区假期已删除');
    fetchSettings();
  } catch (error: any) {
    showHolidayMessage('error', error.message || '删除失败');
  }
}

function selectAllModules() {
  (settings.value?.modules || []).forEach((m) => selectedModules.value.add(m.module_code));
}

function clearModules() {
  selectedModules.value.clear();
}

onMounted(() => {
  fetchSettings();
});
</script>

<template>
  <Page
    title="系统参数维护"
    description="统一维护部门、岗位、地区和模块清单，用户管理页面会直接读取这些配置。"
    v-loading="loading"
  >
    <div style="display: grid; grid-template-columns: minmax(420px, 1.15fr) minmax(320px, 0.85fr); gap: 20px">
      <div>
        <ElCard header="参数配置">
          <p style="color: #64748b; margin-bottom: 18px">前三项按“一行一个值”维护；模块列表、地区假期和地区假期名称清单都统一由数据库中的系统参数维护，相关页面会直接读取这里的结果。</p>

          <ElForm label-width="120px">
            <ElFormItem label="部门列表">
              <ElInput
                v-model="deptStr"
                type="textarea"
                :rows="3"
                placeholder="例如：&#10;研发部&#10;运营部&#10;行政部"
              />
            </ElFormItem>

            <ElFormItem label="岗位列表">
              <ElInput
                v-model="posStr"
                type="textarea"
                :rows="3"
                placeholder="例如：&#10;前端开发&#10;后端开发&#10;人事专员"
              />
            </ElFormItem>

            <ElFormItem label="地区列表">
              <ElInput
                v-model="regionStr"
                type="textarea"
                :rows="3"
                placeholder="例如：&#10;深圳&#10;广州&#10;上海"
              />
            </ElFormItem>

            <ElFormItem label="模块列表">
              <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-bottom: 12px">
                <ElButton size="small" type="default" @click="selectAllModules">全选模块</ElButton>
                <ElButton size="small" type="default" @click="clearModules">清空选择</ElButton>
                <span style="color: #2563eb; font-weight: 700">{{ modulesSummary }}</span>
              </div>
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px">
                <div
                  v-for="mod in settings?.modules"
                  :key="mod.module_code"
                  style="padding: 14px 16px; border: 1px solid #dbeafe; border-radius: 12px; background: #f8fbff; cursor: pointer;"
                  @click="selectedModules.has(mod.module_code) ? selectedModules.delete(mod.module_code) : selectedModules.add(mod.module_code)"
                >
                  <ElCheckbox v-model="selectedModules" :label="mod.module_code" style="margin-right: 10px" />
                  <div>
                    <div style="font-weight: 700">{{ mod.module_name }}</div>
                    <div style="color: #64748b; font-size: 12px; margin-top: 4px">{{ mod.module_code }}</div>
                  </div>
                </div>
              </div>
              <p style="color: #64748b; font-size: 12px; margin-top: 8px">这里展示的是数据库中当前维护的系统模块，勾选后才会出现在用户权限分配中。</p>
            </ElFormItem>

            <ElFormItem>
              <ElButton type="primary" @click="handleSaveSettings">保存系统参数</ElButton>
            </ElFormItem>
          </ElForm>

          <div
            v-if="formMessage"
            style="margin-top: 16px; padding: 12px 14px; border-radius: 10px; white-space: pre-wrap;"
            :style="formMessageType === 'success' ? 'background: #dcfce7; color: #166534;' : 'background: #fee2e2; color: #991b1b;'"
          >
            {{ formMessage }}
          </div>

          <div style="margin-top: 24px; padding-top: 24px; border-top: 1px solid #e2e8f0">
            <h3 style="margin: 0 0 12px; font-size: 18px">报销理由维护</h3>
            <p style="margin: 0 0 18px; color: #64748b">在这里维护员工报销页面可勾选的报销理由，一行一个值。</p>
            <ElForm label-width="160px">
              <ElFormItem label="报销理由列表">
                <ElInput
                  v-model="claimReasonsStr"
                  type="textarea"
                  :rows="3"
                  placeholder="例如：&#10;餐饮报销&#10;交通报销&#10;住宿报销&#10;其他报销"
                />
              </ElFormItem>
            </ElForm>
            <p style="color: #64748b; font-size: 12px; margin-top: 8px">保存系统参数后，员工报销页面的“报销理由”下拉会直接读取这里的配置。</p>
          </div>

          <div style="margin-top: 24px; padding-top: 24px; border-top: 1px solid #e2e8f0">
            <h3 style="margin: 0 0 12px; font-size: 18px">币种维护</h3>
            <p style="margin: 0 0 18px; color: #64748b">在这里维护报销页面可用币种，以及换算成港币时使用的汇率。</p>
            <ElForm label-width="160px">
              <ElFormItem label="币种列表">
                <ElInput
                  v-model="claimCurrenciesStr"
                  type="textarea"
                  :rows="3"
                  placeholder="例如：&#10;CNY,1.09&#10;HKD,1.0&#10;USD,7.8&#10;MOP,0.97"
                />
              </ElFormItem>
            </ElForm>
            <p style="color: #64748b; font-size: 12px; margin-top: 8px">格式：`币种编码,换算港币汇率`，例如 `USD,7.8`。香港员工报销时会按这里的汇率自动折算港币。</p>
          </div>

          <div style="margin-top: 24px; padding-top: 24px; border-top: 1px solid #e2e8f0">
            <h3 style="margin: 0 0 12px; font-size: 18px">地区假期维护</h3>
            <p style="margin: 0 0 18px; color: #64748b">在这里维护各个地区的节假日。可选择年份、日期区间（可只填一天）、假期名称和地区，保存后请假管理日历会直接读取。</p>

            <ElForm label-width="100px" inline>
              <ElFormItem label="地区">
                <ElSelect v-model="holidayForm.region" style="width: 140px" @change="buildHolidayNameOptions">
                  <ElOption v-for="r in settings?.regions" :key="r" :label="r" :value="r" />
                </ElSelect>
              </ElFormItem>
              <ElFormItem label="年份">
                <ElSelect v-model="holidayForm.year" style="width: 100px" @change="syncHolidayDatesToYear">
                  <ElOption v-for="y in Array.from({ length: 100 }, (_, i) => 2000 + i)" :key="y" :label="y + '年'" :value="y" />
                </ElSelect>
              </ElFormItem>
              <ElFormItem label="开始日期">
                <ElDatePicker v-model="holidayForm.startDate" type="date" style="width: 140px" @change="syncHolidayYearToDates" />
              </ElFormItem>
              <ElFormItem label="结束日期">
                <ElDatePicker v-model="holidayForm.endDate" type="date" style="width: 140px" @change="syncHolidayYearToDates" />
              </ElFormItem>
              <ElFormItem label="假期名称">
                <ElSelect v-model="holidayForm.holidayName" style="width: 120px">
                  <ElOption v-for="name in resolveHolidayCatalogByRegion(holidayForm.region)" :key="name" :label="name" :value="name" />
                </ElSelect>
              </ElFormItem>
              <ElFormItem>
                <ElButton type="primary" @click="handleSaveHoliday">保存地区假期</ElButton>
              </ElFormItem>
            </ElForm>

            <p style="color: #64748b; font-size: 12px; margin-top: 8px">说明：同一地区同一天只保留一条假期记录；如果选择日期区间，会一次性写入多天并覆盖该区间内原有假期名称。</p>
            <div
              v-if="holidayMessage"
              style="margin-top: 12px; padding: 12px 14px; border-radius: 10px; white-space: pre-wrap;"
              :style="holidayMessageType === 'success' ? 'background: #dcfce7; color: #166534;' : 'background: #fee2e2; color: #991b1b;'"
            >
              {{ holidayMessage }}
            </div>
          </div>

          <div style="margin-top: 24px; padding-top: 24px; border-top: 1px solid #e2e8f0">
            <h3 style="margin: 0 0 12px; font-size: 18px">地区假期名称清单维护</h3>
            <p style="margin: 0 0 18px; color: #64748b">在这里维护“每个地区可选哪些假期名称”。这里的地区会严格和上方“地区列表”保持一致，地区假期录入下拉会直接读取这里的配置。</p>

            <ElForm label-width="100px">
              <ElFormItem label="地区">
                <ElSelect v-model="catalogForm.region" style="width: 140px" @change="fillCatalogEditor">
                  <ElOption v-for="r in settings?.regions" :key="r" :label="r" :value="r" />
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
                <ElButton type="primary" @click="handleSaveCatalog">保存地区假期名称清单</ElButton>
              </ElFormItem>
            </ElForm>

            <p style="color: #64748b; font-size: 12px; margin-top: 8px">建议每个地区都保留“其他”，便于录入临时假期或特殊安排。</p>
            <div
              v-if="catalogMessage"
              style="margin-top: 12px; padding: 12px 14px; border-radius: 10px; white-space: pre-wrap;"
              :style="catalogMessageType === 'success' ? 'background: #dcfce7; color: #166534;' : 'background: #fee2e2; color: #991b1b;'"
            >
              {{ catalogMessage }}
            </div>
          </div>
        </ElCard>
      </div>

      <div>
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
                <ElOption v-for="y in Array.from({ length: 100 }, (_, i) => 2000 + i)" :key="y" :label="y + '年'" :value="y" />
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
      </div>
    </div>
  </Page>
</template>
