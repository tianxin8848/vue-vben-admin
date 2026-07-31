<script lang="ts" setup>
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';

import { ElButton, ElCard, ElOption, ElSelect } from 'element-plus';

import {
  deleteRegionalHolidayApi,
  getAnnualLeaveSummaryApi,
  getEmployeesApi,
  getLeaveCalendarApi,
  getSystemSettingsApi,
  upsertRegionalHolidayApi,
} from '#/api';
import { $t } from '#/locales';

import CalendarPanel from '../calendar/components/CalendarPanel.vue';
import DetailPanel from '../calendar/components/DetailPanel.vue';
import FilterPanel from '../calendar/components/FilterPanel.vue';
import StatsPanel from '../calendar/components/StatsPanel.vue';

const router = useRouter();
const loading = ref(false);

const currentTime = ref('');
let timer: null | number = null;

const currentYear = ref(2026);
const selectedDateKey = ref('');

const searchForm = reactive({
  team: '',
  region: '',
  employee_keyword: '',
  approval_status: '',
  risk_threshold: 5,
  view_mode: 'standard' as 'detail' | 'standard',
});

const regions = ref<string[]>([]);
const teams = ref<string[]>([]);
const employeesDirectory = ref<any[]>([]);
const regionalHolidays = ref<any[]>([]);

const calendarRecords = ref<any[]>([]);

const annualLeaveSummary = ref<null | {
  available_days: number;
  entitlement_days: number;
  used_days: number;
  year: number;
}>(null);

function toUTC8DateKey(date: Date): string {
  const utc8 = new Date(date.getTime() + 8 * 3600 * 1000);
  const y = utc8.getUTCFullYear();
  const m = String(utc8.getUTCMonth() + 1).padStart(2, '0');
  const d = String(utc8.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getUTC8Now(): Date {
  return new Date(Date.now() + 8 * 3600 * 1000);
}

const dayMap = computed(() => {
  const map: Record<string, any[]> = {};
  calendarRecords.value.forEach((record) => {
    (record.date_keys || []).forEach((dateKey: string) => {
      if (!dateKey.startsWith(`${currentYear.value}-`)) return;
      map[dateKey] = map[dateKey] || [];
      map[dateKey].push({ ...record });
    });
  });
  Object.values(map).forEach((entries) => {
    entries.sort((left: any, right: any) =>
      left.employee_name.localeCompare(right.employee_name, 'zh-CN'),
    );
  });
  return map;
});

const filteredEmployees = computed(() => {
  const keyword = searchForm.employee_keyword.trim();
  const ungroupedLabel = $t('page.leave.calendarView.ungrouped');
  const unsetRegionLabel = $t('page.leave.calendarView.unsetRegion');
  let source = employeesDirectory.value;
  if (source.length === 0) {
    source = calendarRecords.value.map((item) => ({
      id: item.id,
      username: item.employee_username,
      name: item.employee_name,
      team: item.employee_department || ungroupedLabel,
      region: item.employee_region || unsetRegionLabel,
    }));
  }
  return source.filter((employee) => {
    const matchesTeam =
      searchForm.team === '' ||
      searchForm.team === 'all' ||
      employee.team === searchForm.team;
    const matchesRegion =
      searchForm.region === '' ||
      searchForm.region === 'all' ||
      (searchForm.region === '__unset__'
        ? employee.region === unsetRegionLabel
        : employee.region === searchForm.region);
    const matchesKeyword =
      !keyword ||
      employee.name.includes(keyword) ||
      employee.username.includes(keyword);
    return matchesTeam && matchesRegion && matchesKeyword;
  });
});

const stats = computed(() => {
  const riskyDates = Object.entries(dayMap.value).filter(
    ([, entries]) => entries.length >= searchForm.risk_threshold,
  );
  const peak = riskyDates.toSorted(
    (left, right) => right[1].length - left[1].length,
  )[0];
  const personUnit = $t('page.leave.calendarView.stats.personUnit');
  return {
    visibleEmployeeCount: filteredEmployees.value.length,
    leaveRecordCount: calendarRecords.value.length,
    riskDayCount: riskyDates.length,
    peakDayText: peak
      ? `${peak[0].slice(5)} · ${peak[1].length}${personUnit}`
      : '-',
  };
});

function onSelectDate(date: Date) {
  selectedDateKey.value = toUTC8DateKey(date);
}

function onPanelChange(date: Date) {
  const utc8 = new Date(date.getTime() + 8 * 3600 * 1000);
  const newYear = utc8.getUTCFullYear();
  const yearChanged = newYear !== currentYear.value;
  currentYear.value = newYear;
  if (yearChanged) {
    fetchCalendar();
    loadAnnualLeaveSummary();
  }
}

function formatNow() {
  const utc8Now = getUTC8Now();
  const weekKeys = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  const weekLabels = weekKeys.map(
    (k) => $t(`page.leave.calendarView.weekdays.${k}`) as string,
  );
  const year = utc8Now.getUTCFullYear();
  const month = String(utc8Now.getUTCMonth() + 1).padStart(2, '0');
  const day = String(utc8Now.getUTCDate()).padStart(2, '0');
  const hours = String(utc8Now.getUTCHours()).padStart(2, '0');
  const minutes = String(utc8Now.getUTCMinutes()).padStart(2, '0');
  const seconds = String(utc8Now.getUTCSeconds()).padStart(2, '0');
  const dayOfWeek = utc8Now.getUTCDay();
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds} ${weekLabels[dayOfWeek]}`;
}

function startLiveClock() {
  currentTime.value = formatNow();
  timer = window.setInterval(() => {
    currentTime.value = formatNow();
  }, 1000);
}

function resetFilters() {
  searchForm.team = '';
  searchForm.region = '';
  searchForm.employee_keyword = '';
  searchForm.approval_status = '';
  searchForm.risk_threshold = 5;
  searchForm.view_mode = 'standard';
  selectedDateKey.value = '';
  fetchCalendar();
}

function updateSearchForm(value: typeof searchForm) {
  Object.assign(searchForm, value);
}

function getActiveRegionKey() {
  if (
    !searchForm.region ||
    searchForm.region === '' ||
    searchForm.region === 'all'
  )
    return '';
  if (searchForm.region === '__unset__') return '';
  return searchForm.region;
}

async function setHoliday() {
  const activeRegion = getActiveRegionKey();
  const dateKey = selectedDateKey.value;
  if (!activeRegion || !dateKey) return;
  try {
    await upsertRegionalHolidayApi({
      region: activeRegion,
      date: dateKey,
      holiday_name: $t('page.leave.calendarView.holidayNames.newYear'),
    });
    await loadSystemSettings();
  } catch {
    // handled in component
  }
}

async function removeHoliday() {
  const activeRegion = getActiveRegionKey();
  const holiday = regionalHolidays.value.find(
    (h: any) => h.region === activeRegion && h.date === selectedDateKey.value,
  );
  if (!holiday) return;
  try {
    await deleteRegionalHolidayApi({
      region: activeRegion,
      date: selectedDateKey.value,
    });
    await loadSystemSettings();
  } catch {
    // handled in component
  }
}

async function fetchCalendar() {
  loading.value = true;
  try {
    const params: Record<string, string> = { year: String(currentYear.value) };
    if (searchForm.team && searchForm.team !== 'all')
      params.team = searchForm.team;
    if (searchForm.region && searchForm.region !== 'all')
      params.region = searchForm.region;
    if (searchForm.employee_keyword)
      params.employee_keyword = searchForm.employee_keyword;
    if (searchForm.approval_status && searchForm.approval_status !== 'all')
      params.approval_status = searchForm.approval_status;

    const data = await getLeaveCalendarApi(currentYear.value, params);
    calendarRecords.value = (data.items || []).filter(
      (item: any) => item.approval_status !== 'withdrawn',
    );
  } catch {
    calendarRecords.value = [];
  } finally {
    loading.value = false;
  }
}

async function loadAnnualLeaveSummary() {
  try {
    const data = await getAnnualLeaveSummaryApi(currentYear.value);
    annualLeaveSummary.value = data;
  } catch {
    annualLeaveSummary.value = null;
  }
}

async function loadSystemSettings() {
  try {
    const settings = await getSystemSettingsApi();
    regions.value = settings.regions || [];
    regionalHolidays.value = settings.regional_holidays || [];
  } catch {
    regions.value = [];
    regionalHolidays.value = [];
  }
}

async function loadEmployees() {
  try {
    const data = await getEmployeesApi();
    const ungroupedLabel = $t('page.leave.calendarView.ungrouped');
    const unsetRegionLabel = $t('page.leave.calendarView.unsetRegion');
    employeesDirectory.value = data
      .map((item: any) => ({
        id: item.id,
        username: item.username,
        name: item.full_name || item.username,
        team: item.department || ungroupedLabel,
        region: item.region || unsetRegionLabel,
        isActive: item.is_active !== false,
      }))
      .filter((item: any) => item.isActive);

    const teamSet = new Set(
      employeesDirectory.value.map((item: any) => item.team).filter(Boolean),
    );
    teams.value = [...teamSet].toSorted((a: string, b: string) =>
      a.localeCompare(b, 'zh-CN'),
    );
  } catch {
    employeesDirectory.value = [];
    teams.value = [];
  }
}

function goBackHome() {
  router.push('/employee/manage/users');
}

function goToWorkflow() {
  router.push('/employee/manage/leave-workflows');
}

onMounted(() => {
  startLiveClock();
  Promise.all([
    fetchCalendar(),
    loadSystemSettings(),
    loadEmployees(),
    loadAnnualLeaveSummary(),
  ]);
});

onUnmounted(() => {
  if (timer) clearInterval(timer);
});
</script>

<template>
  <Page
    :title="$t('page.leave.title')"
    :description="$t('page.leave.calendarView.description')"
    v-loading="loading"
  >
    <ElCard>
      <template #header>
        <span>{{ currentTime }}</span>
        <ElButton @click="goBackHome">
          {{ $t('page.leave.calendarView.backToWorkspace') }}
        </ElButton>
        <ElSelect
          v-model="searchForm.region"
          @change="searchForm.region = $event"
        >
          <ElOption
            :label="$t('page.leave.calendarView.allRegions')"
            value=""
          />
          <ElOption
            :label="$t('page.leave.calendarView.unsetRegion')"
            value="__unset__"
          />
          <ElOption v-for="r in regions" :key="r" :label="r" :value="r" />
        </ElSelect>
      </template>

      <div>
        <ElButton type="primary" plain>
          {{ $t('page.leave.calendar') }}
        </ElButton>
        <ElButton @click="goToWorkflow">
          {{ $t('page.leave.calendarView.workflowMaintenance') }}
        </ElButton>
      </div>

      <StatsPanel :stats="stats" :annual-leave-summary="annualLeaveSummary" />

      <FilterPanel
        :search-form="searchForm"
        :teams="teams"
        @update:search-form="updateSearchForm"
        @reset-filters="resetFilters"
      />

      <CalendarPanel
        :day-map="dayMap"
        :selected-date-key="selectedDateKey"
        :current-year="currentYear"
        :search-form="searchForm"
        @select-date="onSelectDate"
        @panel-change="onPanelChange"
      />

      <DetailPanel
        :day-map="dayMap"
        :selected-date-key="selectedDateKey"
        :region="searchForm.region"
        :regional-holidays="regionalHolidays"
        @set-holiday="setHoliday"
        @remove-holiday="removeHoliday"
      />
    </ElCard>
  </Page>
</template>
