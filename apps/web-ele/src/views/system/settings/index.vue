<script lang="ts" setup>
import type { SystemSettingsApi } from '#/api';

import { onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import { ElAlert, ElCard } from 'element-plus';

import {
  ALL_MODULE_CATALOG,
  deleteRegionalHolidayRangeApi,
  getSystemSettingsApi,
  updateSystemSettingsApi,
  upsertRegionalHolidayRangeApi,
} from '#/api';

import ClaimReasonEditor from './components/ClaimReasonEditor.vue';
import CurrencyEditor from './components/CurrencyEditor.vue';
import HolidayCatalogEditor from './components/HolidayCatalogEditor.vue';
import HolidayEditor from './components/HolidayEditor.vue';
import SettingsForm from './components/SettingsForm.vue';
import SettingsPreview from './components/SettingsPreview.vue';

const loading = ref(false);
const settings = ref<null | SystemSettingsApi.SystemSettingsResponse>(null);

const deptStr = ref('');
const posStr = ref('');
const regionStr = ref('');
const claimReasonsStr = ref('');
const claimCurrenciesStr = ref('');

const selectedModules = ref<string[]>([]);

const formMessage = ref('');
const formMessageType = ref<'' | 'error' | 'success'>('');
const holidayMessage = ref('');
const holidayMessageType = ref<'' | 'error' | 'success'>('');
const catalogMessage = ref('');
const catalogMessageType = ref<'' | 'error' | 'success'>('');

function showFormMessage(type: 'error' | 'success', text: string) {
  formMessageType.value = type;
  formMessage.value = text;
}

function showHolidayMessage(type: 'error' | 'success', text: string) {
  holidayMessageType.value = type;
  holidayMessage.value = text;
}

function showCatalogMessage(type: 'error' | 'success', text: string) {
  catalogMessageType.value = type;
  catalogMessage.value = text;
}

function parseLineList(raw: string): string[] {
  return raw
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseClaimCurrencies(
  raw: string,
): SystemSettingsApi.ClaimCurrencyItem[] {
  return raw
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => {
      const [currencyCode, rateText] = item
        .split(',')
        .map((part) => part.trim());
      return {
        currency_code: (currencyCode || '').toUpperCase(),
        to_hkd_rate: Number(rateText),
      };
    })
    .filter(
      (item) =>
        item.currency_code &&
        Number.isFinite(item.to_hkd_rate) &&
        item.to_hkd_rate > 0,
    );
}

async function fetchSettings() {
  loading.value = true;
  try {
    settings.value = await getSystemSettingsApi();
    if (settings.value) {
      deptStr.value = settings.value.departments.join('\n');
      posStr.value = settings.value.positions.join('\n');
      regionStr.value = settings.value.regions.join('\n');
      claimReasonsStr.value = (settings.value.claim_reasons || [])
        .map((item) => item.name || '')
        .filter(Boolean)
        .join('\n');
      claimCurrenciesStr.value = (settings.value.claim_currencies || [])
        .map((item) => `${item.currency_code || ''},${item.to_hkd_rate || ''}`)
        .join('\n');

      selectedModules.value = settings.value.modules.map((m) => m.module_code);
    }
  } finally {
    loading.value = false;
  }
}

async function handleSaveSettings() {
  try {
    // 以全量目录为基础，合并后端可能存在的额外模块，确保新勾选的模块也能正确保存
    const fullCatalog = [...ALL_MODULE_CATALOG];
    const catalogCodes = new Set(fullCatalog.map((m) => m.module_code));
    for (const m of settings.value?.modules || []) {
      if (catalogCodes.has(m.module_code)) {
        continue;
      }
      fullCatalog.push(m);
    }
    const data: SystemSettingsApi.SystemSettingsUpdate = {
      departments: parseLineList(deptStr.value),
      positions: parseLineList(posStr.value),
      regions: parseLineList(regionStr.value),
      modules: fullCatalog
        .filter((m) => selectedModules.value.includes(m.module_code))
        .map((m) => ({
          module_code: m.module_code,
          module_name: m.module_name,
        })),
      claim_reasons: parseLineList(claimReasonsStr.value).map((name) => ({
        name,
      })),
      claim_currencies: parseClaimCurrencies(claimCurrenciesStr.value),
      regional_holidays: settings.value?.regional_holidays || [],
      regional_holiday_catalogs:
        settings.value?.regional_holiday_catalogs || [],
    };
    settings.value = await updateSystemSettingsApi(data);
    showFormMessage('success', '保存成功');
    fetchSettings();
  } catch (error: any) {
    showFormMessage('error', error.message || '保存失败');
  }
}

async function handleSaveHoliday(
  data: SystemSettingsApi.RegionalHolidayRangeUpsert,
) {
  try {
    settings.value = await upsertRegionalHolidayRangeApi(data);
    showHolidayMessage('success', '地区假期已保存');
    fetchSettings();
  } catch (error: any) {
    showHolidayMessage('error', error.message || '保存失败');
  }
}

async function handleSaveCatalog(data: {
  holidayNames: string;
  region: string;
}) {
  try {
    const catalogs = settings.value?.regional_holiday_catalogs || [];
    const existingIndex = catalogs.findIndex(
      (c) => c.region.toLowerCase() === data.region.toLowerCase(),
    );
    const updatedCatalogs = [...catalogs];
    if (existingIndex === -1) {
      updatedCatalogs.push({
        region: data.region,
        holiday_names: parseLineList(data.holidayNames),
      });
    } else {
      updatedCatalogs[existingIndex] = {
        region: data.region,
        holiday_names: parseLineList(data.holidayNames),
      };
    }

    const updateData: SystemSettingsApi.SystemSettingsUpdate = {
      regional_holiday_catalogs: updatedCatalogs,
    };
    settings.value = await updateSystemSettingsApi(updateData);
    showCatalogMessage('success', '地区假期名称清单已保存');
    fetchSettings();
  } catch (error: any) {
    showCatalogMessage('error', error.message || '保存失败');
  }
}

async function handleDeleteHoliday(
  startDate: string,
  endDate: string,
  region: string,
) {
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
    <div
      class="grid gap-5 lg:grid-cols-[minmax(420px,1.15fr)_minmax(320px,0.85fr)]"
    >
      <ElCard>
        <template #header>
          <span class="text-base font-bold">参数配置</span>
        </template>
        <p class="mb-4 text-sm text-muted-foreground">
          前三项按“一行一个值”维护；模块列表、地区假期和地区假期名称清单都统一由数据库中的系统参数维护，相关页面会直接读取这里的结果。
        </p>

        <SettingsForm
          v-model:dept-str="deptStr"
          v-model:pos-str="posStr"
          v-model:region-str="regionStr"
          v-model:selected-modules="selectedModules"
          @save="handleSaveSettings"
        />

        <ElAlert
          v-if="formMessage"
          :title="formMessage"
          :type="formMessageType === 'success' ? 'success' : 'error'"
          show-icon
          :closable="false"
          class="mt-4 whitespace-pre-wrap"
        />

        <ClaimReasonEditor v-model="claimReasonsStr" />
        <CurrencyEditor v-model="claimCurrenciesStr" />

        <HolidayEditor
          :regions="settings?.regions || []"
          :holiday-catalogs="settings?.regional_holiday_catalogs || []"
          v-model:message="holidayMessage"
          v-model:message-type="holidayMessageType"
          @save="handleSaveHoliday"
        />

        <HolidayCatalogEditor
          :regions="settings?.regions || []"
          :holiday-catalogs="settings?.regional_holiday_catalogs || []"
          v-model:message="catalogMessage"
          v-model:message-type="catalogMessageType"
          @save="handleSaveCatalog"
        />
      </ElCard>

      <SettingsPreview
        :settings="settings"
        @delete-holiday="handleDeleteHoliday"
      />
    </div>
  </Page>
</template>
