<script lang="ts" setup>
import type { WorkbenchQuickNavItem } from '@vben/common-ui';

import type { SystemSettingsApi } from '#/api';

import { computed, onMounted, ref } from 'vue';

import { WorkbenchQuickNav } from '@vben/common-ui';

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
const activeTab = ref<SettingsTab>('basic');

// 快捷导航：url 字段复用为 tab 标识，点击时据此切换
const quickNavItems: WorkbenchQuickNavItem[] = [
  {
    color: '#1fdaca',
    icon: 'ion:settings-outline',
    title: '基础参数',
    url: 'basic',
  },
  {
    color: '#bf0c2c',
    icon: 'ion:people-outline',
    title: '员工字段',
    url: 'employee',
  },
  {
    color: '#e18525',
    icon: 'ion:cash-outline',
    title: '报销配置',
    url: 'claim',
  },
  {
    color: '#3fb27f',
    icon: 'ion:calendar-outline',
    title: '地区假期',
    url: 'holiday',
  },
  {
    color: '#00d8ff',
    icon: 'ion:eye-outline',
    title: '当前预览',
    url: 'preview',
  },
];

// 当前激活的导航项标题，用于在导航下方高亮提示所处分区
const activeNavTitle = computed(
  () => quickNavItems.find((item) => item.url === activeTab.value)?.title || '',
);

function handleQuickNavClick(item: WorkbenchQuickNavItem) {
  const tab = item.url as SettingsTab;
  if (tab) {
    activeTab.value = tab;
  }
}

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
  <Page
    title="系统参数维护"
    description="统一维护部门、岗位、地区、模块、员工字段、报销配置与地区假期，相关页面会直接读取这些配置。"
    :auto-content-height="true"
    v-loading="loading"
  >
    <div class="flex h-full flex-col gap-2">
      <!-- 顶部快捷导航：点击卡片切换到对应配置分区 -->
      <WorkbenchQuickNav
        :items="quickNavItems"
        title="配置导航"
        class="settings-quick-nav"
        @click="handleQuickNavClick"
      />

      <!-- 当前所处分区提示 -->
      <div
        class="flex items-center rounded bg-primary/10 px-3 py-1.5 text-sm text-primary"
      >
        <span class="font-semibold">当前分区：</span>
        <span class="ml-1">{{ activeNavTitle }}</span>
      </div>

      <!-- 基础参数：部门 / 岗位 / 地区 / 模块 -->
      <div v-show="activeTab === 'basic'" class="min-h-0 flex-1">
        <ElCard>
          <template #header>
            <span class="text-base font-bold">参数配置</span>
          </template>
          <p class="mb-4 text-sm text-muted-foreground">
            基础参数、员工字段与报销配置共享同一个保存动作，地区假期使用独立保存。
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
            <span class="text-base font-bold">员工可自编辑字段</span>
          </template>
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
        </ElCard>
      </div>

      <!-- 报销配置：报销理由 / 币种 -->
      <div v-show="activeTab === 'claim'" class="min-h-0 flex-1">
        <ElCard>
          <template #header>
            <span class="text-base font-bold">报销配置</span>
          </template>
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
        </ElCard>
      </div>

      <!-- 地区假期：假期维护 / 假期名称清单 -->
      <div v-show="activeTab === 'holiday'" class="min-h-0 flex-1">
        <ElCard>
          <template #header>
            <span class="text-base font-bold">地区假期</span>
          </template>
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

<style scoped>
.settings-quick-nav :deep(.vben-icon) {
  transition: transform 0.3s ease;
}

.settings-quick-nav :deep(.group:hover .vben-icon) {
  transform: scale(1.25);
}
</style>
