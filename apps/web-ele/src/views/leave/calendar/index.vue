<script lang="ts" setup>
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';

import {
  deleteRegionalHolidayApi,
  getEmployeesApi,
  getLeaveCalendarApi,
  getSystemSettingsApi,
  upsertRegionalHolidayApi,
} from '#/api';

import CalendarPanel from './CalendarPanel.vue';
import DetailPanel from './DetailPanel.vue';
import FilterPanel from './FilterPanel.vue';
import PageHeader from './PageHeader.vue';
import StatsPanel from './StatsPanel.vue';

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
  let source = employeesDirectory.value;
  if (source.length === 0) {
    source = calendarRecords.value.map((item) => ({
      id: item.id,
      username: item.employee_username,
      name: item.employee_name,
      team: item.employee_department || '未分组',
      region: item.employee_region || '未设置地区',
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
        ? employee.region === '未设置地区'
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
  return {
    visibleEmployeeCount: filteredEmployees.value.length,
    leaveRecordCount: calendarRecords.value.length,
    riskDayCount: riskyDates.length,
    peakDayText: peak ? `${peak[0].slice(5)} · ${peak[1].length}人` : '-',
  };
});

function onSelectDate(date: Date) {
  selectedDateKey.value = toUTC8DateKey(date);
}

function onPanelChange(date: Date) {
  const utc8 = new Date(date.getTime() + 8 * 3600 * 1000);
  currentYear.value = utc8.getUTCFullYear();
}

function formatNow() {
  const utc8Now = getUTC8Now();
  const weekLabels = [
    '星期日',
    '星期一',
    '星期二',
    '星期三',
    '星期四',
    '星期五',
    '星期六',
  ];
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

function changeYear(delta: number) {
  currentYear.value += delta;
  selectedDateKey.value = '';
  fetchCalendar();
}

function goToCurrentYear() {
  currentYear.value = getUTC8Now().getUTCFullYear();
  selectedDateKey.value = '';
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
      holiday_name: '元旦',
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
    employeesDirectory.value = data
      .map((item: any) => ({
        id: item.id,
        username: item.username,
        name: item.full_name || item.username,
        team: item.department || '未分组',
        region: item.region || '未设置地区',
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
  router.push('/employee');
}

function goToWorkflow() {
  router.push('/employee/manage/leave-workflows');
}

onMounted(() => {
  startLiveClock();
  Promise.all([fetchCalendar(), loadSystemSettings(), loadEmployees()]);
});

onUnmounted(() => {
  if (timer) clearInterval(timer);
});
</script>

<template>
  <div class="leave-calendar-page" v-loading="loading">
    <PageHeader
      :current-time="currentTime"
      :current-year="currentYear"
      :regions="regions"
      :region="searchForm.region"
      @go-back-home="goBackHome"
      @change-year="changeYear"
      @go-to-current-year="goToCurrentYear"
      @update:region="searchForm.region = $event"
    />

    <div style="display: flex; gap: 8px; margin: 16px 0">
      <span
        style="
          padding: 8px 16px;
          font-size: 14px;
          font-weight: 600;
          color: #2563eb;
          cursor: pointer;
          background: #eff6ff;
          border-radius: 8px;
        "
        >请假日历</span>
      <span
        style="
          padding: 8px 16px;
          font-size: 14px;
          color: #64748b;
          cursor: pointer;
          border-radius: 8px;
          transition: all 0.2s;
        "
        @click="goToWorkflow"
        @mouseenter="
          ($event.target as HTMLElement).style.background = '#f1f5f9';
          ($event.target as HTMLElement).style.color = '#0f172a';
        "
        @mouseleave="
          ($event.target as HTMLElement).style.background = 'transparent';
          ($event.target as HTMLElement).style.color = '#64748b';
        "
        >流程维护</span>
    </div>

    <div style="margin-bottom: 16px">
      <StatsPanel :stats="stats" />
    </div>

    <div style="margin-bottom: 16px">
      <FilterPanel
        :search-form="searchForm"
        :teams="teams"
        @update:search-form="updateSearchForm"
        @reset-filters="resetFilters"
      />
    </div>

    <div style="margin-bottom: 16px">
      <CalendarPanel
        :day-map="dayMap"
        :selected-date-key="selectedDateKey"
        :current-year="currentYear"
        :search-form="searchForm"
        @select-date="onSelectDate"
        @panel-change="onPanelChange"
      />
    </div>

    <DetailPanel
      :day-map="dayMap"
      :selected-date-key="selectedDateKey"
      :region="searchForm.region"
      :regional-holidays="regionalHolidays"
      @set-holiday="setHoliday"
      @remove-holiday="removeHoliday"
    />
  </div>
</template>

<style scoped>
.leave-calendar-page {
  padding: 24px;
}
</style>
