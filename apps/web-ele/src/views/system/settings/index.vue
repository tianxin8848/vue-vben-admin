<script lang="ts" setup>
import type { WorkbenchQuickNavItem } from '@vben/common-ui';

import type { SystemSettingsApi } from '#/api';

import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Page, WorkbenchQuickNav } from '@vben/common-ui';
import { useI18n } from '@vben/locales';

import { ElAlert, ElButton } from 'element-plus';

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
import LeaveTypesEditor from './components/LeaveTypesEditor.vue';
import SettingsCard from './components/SettingsCard.vue';
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
const leaveTypes = ref<SystemSettingsApi.LeaveTypeItem[]>([]);

const formMessage = ref('');
const formMessageType = ref<'' | 'error' | 'success'>('');
const holidayMessage = ref('');
const holidayMessageType = ref<'' | 'error' | 'success'>('');
const catalogMessage = ref('');
const catalogMessageType = ref<'' | 'error' | 'success'>('');

type SettingsTab =
  | 'basic'
  | 'claim'
  | 'employee'
  | 'holiday'
  | 'leave'
  | 'preview';
const VALID_TABS = new Set<SettingsTab>([
  'basic',
  'claim',
  'employee',
  'holiday',
  'leave',
  'preview',
]);
const activeTab = ref<SettingsTab>('basic');

const route = useRoute();
const router = useRouter();

// 分区导航卡片：与工作台「系统参数管理配置」快捷导航同一套卡片组件，
// url 字段复用为分区标识，点击时切换 activeTab 并同步到 route.query.tab。
const quickNavItems = computed<WorkbenchQuickNavItem[]>(() => [
  {
    color: '#1fdaca',
    icon: 'ion:settings-outline',
    title: t('page.system.settingsDetail.nav.basic'),
    url: 'basic',
  },
  {
    color: '#bf0c2c',
    icon: 'ion:people-outline',
    title: t('page.system.settingsDetail.nav.employeeFields'),
    url: 'employee',
  },
  {
    color: '#e18525',
    icon: 'ion:cash-outline',
    title: t('page.system.settingsDetail.nav.claimConfig'),
    url: 'claim',
  },
  {
    color: '#3fb27f',
    icon: 'ion:calendar-outline',
    title: t('page.system.settingsDetail.nav.regionalHoliday'),
    url: 'holiday',
  },
  {
    color: '#7367f0',
    icon: 'ion:timer-outline',
    title: t('page.system.settingsDetail.nav.leaveType'),
    url: 'leave',
  },
  {
    color: '#00d8ff',
    icon: 'ion:eye-outline',
    title: t('page.system.settingsDetail.nav.preview'),
    url: 'preview',
  },
]);

function handleNavClick(item: WorkbenchQuickNavItem) {
  const tab = item.url as SettingsTab;
  if (tab && VALID_TABS.has(tab)) {
    activeTab.value = tab;
    router.replace({ query: { ...route.query, tab } });
  }
}

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

/**
 * 模块全量目录：以本地目录为基底，用后端返回的名称覆盖同名项，并补上目录里
 * 没有的后端模块。
 *
 * 表单展示（传给 SettingsForm）与保存（handleSaveSettings）取同一份，
 * 避免两处各合并一次而出现「界面上看到的」和「保存下去的」不一致。
 */
const allModules = computed<SystemSettingsApi.SystemModuleItem[]>(() => {
  const backendModules = settings.value?.modules || [];
  const merged = ALL_MODULE_CATALOG.map((m) => {
    const backend = backendModules.find((b) => b.module_code === m.module_code);
    return { ...m, module_name: backend?.module_name ?? m.module_name };
  });
  const codes = new Set(merged.map((m) => m.module_code));
  for (const b of backendModules) {
    if (!codes.has(b.module_code)) {
      merged.push({ ...b });
    }
  }
  return merged;
});

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
      leaveTypes.value = [...(settings.value.leave_types || [])];
    }
  } catch (error: any) {
    console.error('[Settings][fetchSettings] 请求失败', error);
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
      modules: allModules.value
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
      leave_types: [...leaveTypes.value],
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
    <!-- 分区导航：与工作台使用同一个卡片组件，保证外边距/圆角/阴影一致 -->
    <WorkbenchQuickNav
      :active="activeTab"
      :items="quickNavItems"
      :title="t('page.system.settingsDetail.nav.title')"
      class="mb-4"
      @click="handleNavClick"
    />

    <!-- 基础参数：部门 / 岗位 / 地区 / 模块 -->
    <div v-show="activeTab === 'basic'">
      <SettingsCard
        :description="t('page.system.settingsDetail.basicConfigHint')"
        :title="t('page.system.settingsDetail.basicConfig')"
      >
        <SettingsForm
          v-model:dept-str="deptStr"
          v-model:pos-str="posStr"
          v-model:region-str="regionStr"
          v-model:selected-modules="selectedModules"
          :modules="allModules"
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
      </SettingsCard>
    </div>

    <!-- 员工可自编辑字段 -->
    <div v-show="activeTab === 'employee'">
      <SettingsCard
        :title="t('page.system.settingsDetail.employeeEditableFields')"
      >
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
      </SettingsCard>
    </div>

    <!-- 报销配置：报销理由 / 币种 -->
    <div v-show="activeTab === 'claim'">
      <SettingsCard :title="t('page.system.settingsDetail.claimConfig')">
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
      </SettingsCard>
    </div>

    <!-- 地区假期：假期维护 / 假期名称清单 -->
    <div v-show="activeTab === 'holiday'">
      <SettingsCard :title="t('page.system.settingsDetail.regionalHoliday')">
        <div class="grid grid-cols-2 gap-6 [&>section]:!mt-0">
          <HolidayEditor
            v-model:message="holidayMessage"
            v-model:message-type="holidayMessageType"
            :holiday-catalogs="settings?.regional_holiday_catalogs || []"
            :holidays="settings?.regional_holidays || []"
            :regions="settings?.regions || []"
            @save="handleSaveHoliday"
          />

          <HolidayCatalogEditor
            v-model:message="catalogMessage"
            v-model:message-type="catalogMessageType"
            :holiday-catalogs="settings?.regional_holiday_catalogs || []"
            :regions="settings?.regions || []"
            @save="handleSaveCatalog"
          />
        </div>
      </SettingsCard>
    </div>

    <!-- 当前预览 -->
    <div v-show="activeTab === 'preview'">
      <SettingsPreview
        :settings="settings"
        @delete-holiday="handleDeleteHoliday"
      />
    </div>

    <!-- 请假类型管理 -->
    <div v-show="activeTab === 'leave'">
      <SettingsCard :title="t('page.system.settingsDetail.leaveTypeConfig')">
        <LeaveTypesEditor v-model="leaveTypes" @save="handleSaveSettings" />
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
      </SettingsCard>
    </div>
  </Page>
</template>
