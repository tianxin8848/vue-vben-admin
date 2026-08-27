<script lang="ts" setup>
import type { SystemSettingsApi } from '#/api';

import { onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

import { useI18n } from '@vben/locales';

import { ElAlert, ElButton, ElCard } from 'element-plus';

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

const { t } = useI18n();

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

type SettingsTab = 'basic' | 'claim' | 'employee' | 'holiday' | 'preview';
const VALID_TABS = new Set<SettingsTab>([
  'basic',
  'claim',
  'employee',
  'holiday',
  'preview',
]);
const activeTab = ref<SettingsTab>('basic');

const route = useRoute();

// 从路由 query 读取分区标识，用于工作台快捷导航跳转后定位分区
function applyTabFromQuery() {
  const tab = route.query.tab as SettingsTab;
  if (tab && VALID_TABS.has(tab)) {
    activeTab.value = tab;
  }
}

// 监听路由 query 变化，支持在 settings 页内再次点击其它分区时也能切换
watch(
  () => route.query.tab,
  () => applyTabFromQuery(),
);

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
    showFormMessage(
      'success',
      t('page.system.settingsDetail.message.saveSuccess'),
    );
    fetchSettings();
  } catch (error: any) {
    console.error('[Settings][handleSaveSettings] 保存失败', error);
    showFormMessage(
      'error',
      error.message || t('page.system.settingsDetail.message.saveFailed'),
    );
  }
}

async function handleSaveHoliday(
  data: SystemSettingsApi.RegionalHolidayRangeUpsert,
) {
  try {
    settings.value = await upsertRegionalHolidayRangeApi(data);
    showHolidayMessage(
      'success',
      t('page.system.settingsDetail.message.holidaySaved'),
    );
    fetchSettings();
  } catch (error: any) {
    showHolidayMessage(
      'error',
      error.message || t('page.system.settingsDetail.message.saveFailed'),
    );
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
    showCatalogMessage(
      'success',
      t('page.system.settingsDetail.message.holidayCatalogSaved'),
    );
    fetchSettings();
  } catch (error: any) {
    showCatalogMessage(
      'error',
      error.message || t('page.system.settingsDetail.message.saveFailed'),
    );
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
    showHolidayMessage(
      'success',
      t('page.system.settingsDetail.message.holidayDeleted'),
    );
    fetchSettings();
  } catch (error: any) {
    showHolidayMessage(
      'error',
      error.message || t('page.system.settingsDetail.message.deleteFailed'),
    );
  }
}

onMounted(() => {
  applyTabFromQuery();
  fetchSettings();
});
</script>

<template>
  <Page v-loading="loading">
    <div class="flex h-full flex-col gap-2">
      <!-- 基础参数：部门 / 岗位 / 地区 / 模块 -->
      <div v-show="activeTab === 'basic'" class="min-h-0 flex-1">
        <ElCard>
          <template #header>
            <span class="text-base font-bold">{{
              t('page.system.settingsDetail.basicConfig')
            }}</span>
          </template>
          <p class="mb-4 text-sm text-muted-foreground">
            {{ t('page.system.settingsDetail.basicConfigHint') }}
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
        </ElCard>
      </div>

      <!-- 员工可自编辑字段 -->
      <div v-show="activeTab === 'employee'" class="min-h-0 flex-1">
        <ElCard>
          <template #header>
            <span class="text-base font-bold">{{
              t('page.system.settingsDetail.employeeEditableFields')
            }}</span>
          </template>
          <EmployeeEditableFieldsEditor
            v-model="selectedEditableFields"
            :catalog="settings?.employee_profile_field_catalog || []"
          />
          <div class="mt-4 flex justify-end">
            <ElButton type="primary" @click="handleSaveSettings">
              {{ t('page.system.settingsDetail.saveSystemSettings') }}
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
        </ElCard>
      </div>

      <!-- 报销配置：报销理由 / 币种 -->
      <div v-show="activeTab === 'claim'" class="min-h-0 flex-1">
        <ElCard>
          <template #header>
            <span class="text-base font-bold">{{
              t('page.system.settingsDetail.claimConfig')
            }}</span>
          </template>
          <div class="grid grid-cols-2 gap-6 [&>section]:!mt-0">
            <ClaimReasonEditor
              v-model="claimReasonsStr"
              @save="handleSaveSettings"
            />
            <CurrencyEditor
              v-model="claimCurrenciesStr"
              @save="handleSaveSettings"
            />
          </div>
          <div class="mt-6 flex justify-end">
            <ElButton type="primary" @click="handleSaveSettings">
              {{ t('page.system.settingsDetail.saveSystemSettings') }}
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
        </ElCard>
      </div>

      <!-- 地区假期：假期维护 / 假期名称清单 -->
      <div v-show="activeTab === 'holiday'" class="min-h-0 flex-1">
        <ElCard>
          <template #header>
            <span class="text-base font-bold">{{
              t('page.system.settingsDetail.regionalHoliday')
            }}</span>
          </template>
          <div class="grid grid-cols-2 gap-6 [&>section]:!mt-0">
            <HolidayEditor
              :regions="settings?.regions || []"
              :holiday-catalogs="settings?.regional_holiday_catalogs || []"
              :holidays="settings?.regional_holidays || []"
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
      </div>

      <!-- 当前预览 -->
      <div v-show="activeTab === 'preview'" class="min-h-0 flex-1">
        <SettingsPreview
          :settings="settings"
          @delete-holiday="handleDeleteHoliday"
        />
      </div>
    </div>
  </Page>
</template>
