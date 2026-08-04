<script lang="ts" setup>
import type { SystemSettingsApi } from '#/api';

import { onMounted, ref } from 'vue';

import { ColPage } from '@vben/common-ui';

import { ElAlert, ElButton, ElCard, ElSegmented } from 'element-plus';

import {
  ALL_MODULE_CATALOG,
  deleteRegionalHolidayRangeApi,
  getSystemSettingsApi,
  updateSystemSettingsApi,
  upsertRegionalHolidayRangeApi,
} from '#/api';

import ClaimReasonEditor from './components/ClaimReasonEditor.vue';
import CurrencyEditor from './components/CurrencyEditor.vue';
import EmployeeEditableFieldsEditor from './components/EmployeeEditableFieldsEditor.vue';
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
const selectedEditableFields = ref<string[]>([]);

const formMessage = ref('');
const formMessageType = ref<'' | 'error' | 'success'>('');
const holidayMessage = ref('');
const holidayMessageType = ref<'' | 'error' | 'success'>('');
const catalogMessage = ref('');
const catalogMessageType = ref<'' | 'error' | 'success'>('');

type SettingsTab = 'basic' | 'claim' | 'employee' | 'holiday';
const activeTab = ref<SettingsTab>('basic');

const segmentedOptions: { label: string; value: SettingsTab }[] = [
  { label: '基础参数', value: 'basic' },
  { label: '员工字段', value: 'employee' },
  { label: '报销配置', value: 'claim' },
  { label: '地区假期', value: 'holiday' },
];

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
      selectedEditableFields.value = [
        ...(settings.value.employee_self_editable_fields || []),
      ];
    }
  } catch (error: any) {
    console.error('[Settings][fetchSettings] 请求失败', error);
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
      employee_self_editable_fields: [...selectedEditableFields.value],
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
    console.error('[Settings][handleSaveSettings] 保存失败', error);
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
  <ColPage
    title="系统参数维护"
    description="统一维护部门、岗位、地区、模块、员工字段、报销配置与地区假期，相关页面会直接读取这些配置。"
    v-loading="loading"
    :left-width="58"
    :right-width="42"
    resizable
  >
    <template #left>
      <ElCard>
        <template #header>
          <span class="text-base font-bold">参数配置</span>
        </template>
        <p class="mb-4 text-sm text-muted-foreground">
          通过下方分段切换不同配置分组；基础参数、员工字段与报销配置共享同一个保存动作，地区假期使用独立保存。
        </p>

        <ElSegmented
          v-model="activeTab"
          :options="segmentedOptions"
          class="mb-2"
        />

        <!-- 基础参数：部门 / 岗位 / 地区 / 模块 -->
        <div v-show="activeTab === 'basic'">
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
        </div>

        <!-- 员工可自编辑字段 -->
        <div v-show="activeTab === 'employee'">
          <EmployeeEditableFieldsEditor
            v-model="selectedEditableFields"
            :catalog="settings?.employee_profile_field_catalog || []"
          />
          <div class="mt-4 flex justify-end">
            <ElButton type="primary" @click="handleSaveSettings">
              保存系统参数
            </ElButton>
          </div>

          <ElAlert
            v-if="formMessage"
            :title="formMessage"
            :type="formMessageType === 'success' ? 'success' : 'error'"
            show-icon
            :closable="false"
            class="mt-4 whitespace-pre-wrap"
          />
        </div>

        <!-- 报销配置：报销理由 / 币种 -->
        <div v-show="activeTab === 'claim'">
          <ClaimReasonEditor v-model="claimReasonsStr" />
          <CurrencyEditor v-model="claimCurrenciesStr" />
          <div class="mt-4 flex justify-end">
            <ElButton type="primary" @click="handleSaveSettings">
              保存系统参数
            </ElButton>
          </div>

          <ElAlert
            v-if="formMessage"
            :title="formMessage"
            :type="formMessageType === 'success' ? 'success' : 'error'"
            show-icon
            :closable="false"
            class="mt-4 whitespace-pre-wrap"
          />
        </div>

        <!-- 地区假期：假期维护 / 假期名称清单 -->
        <div v-show="activeTab === 'holiday'">
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
        </div>
      </ElCard>
    </template>

    <SettingsPreview
      :settings="settings"
      @delete-holiday="handleDeleteHoliday"
    />
  </ColPage>
</template>
