import type { RegionalHoliday } from '../../components/data';

import { computed, onMounted, reactive, ref } from 'vue';

import {
  deleteRegionalHolidayApi,
  getAnnualLeaveSummaryApi,
  getEmployeesApi,
  getLeaveCalendarApi,
  getLeaveCalendarMetaApi,
  upsertRegionalHolidayApi,
} from '#/api';
import { $t } from '#/locales';
import { regionsMatch } from '#/utils/regions';

import { loadLeaveTypeLabels } from '../../shared/leave-types';

export interface CalendarSearchForm {
  approval_status: string;
  employee_keyword: string;
  region: string;
  risk_threshold: number;
  team: string;
  view_mode: 'detail' | 'standard';
}

export interface CalendarEmployee {
  id: number | string;
  isActive?: boolean;
  name: string;
  region: string;
  team: string;
  username: string;
}

export interface AnnualLeaveSummary {
  available_days: number;
  entitlement_days: number;
  used_days: number;
  year: number;
}

/** 日期 → `YYYY-MM-DD`（按 UTC+8 取日，避免本地时区跨日） */
function toUTC8DateKey(date: Date): string {
  const utc8 = new Date(date.getTime() + 8 * 3600 * 1000);
  const y = utc8.getUTCFullYear();
  const m = String(utc8.getUTCMonth() + 1).padStart(2, '0');
  const d = String(utc8.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * 年历（管理员视角）的数据层：查询条件、日历记录、员工目录、区域假日与统计。
 * 所有请求失败均回退为空数据，避免打断页面渲染。
 */
export function useCalendarData() {
  const loading = ref(false);

  const currentYear = ref(2026);
  const selectedDateKey = ref('');

  const searchForm = reactive<CalendarSearchForm>({
    team: '',
    region: '',
    employee_keyword: '',
    approval_status: '',
    risk_threshold: 5,
    view_mode: 'standard',
  });

  const regions = ref<string[]>([]);
  const teams = ref<string[]>([]);
  const employeesDirectory = ref<CalendarEmployee[]>([]);
  const regionalHolidays = ref<RegionalHoliday[]>([]);
  const calendarRecords = ref<any[]>([]);
  const annualLeaveSummary = ref<AnnualLeaveSummary | null>(null);

  // ─── 派生数据 ──────────────────────────────────────────────────────────────

  /** 当前年份的「日期 → 当日请假条目」映射，条目按姓名排序 */
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

  /** 按团队 / 地区 / 关键字过滤后的员工列表 */
  const filteredEmployees = computed<CalendarEmployee[]>(() => {
    const keyword = searchForm.employee_keyword.trim();
    const ungroupedLabel = $t('page.leave.calendarView.ungrouped');
    const unsetRegionLabel = $t('page.leave.calendarView.unsetRegion');

    // 员工目录未加载时，回退用日历记录里的人名
    let source: CalendarEmployee[] = employeesDirectory.value;
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
      // 「未设置地区」需精确匹配（它本身就是一个特殊分组）
      // 其余地区用宽松匹配：「香港」=「HK」=「Hong Kong」
      const matchesRegion =
        searchForm.region === '' ||
        searchForm.region === 'all' ||
        (searchForm.region === '__unset__'
          ? employee.region === unsetRegionLabel
          : regionsMatch(employee.region, searchForm.region));
      const matchesKeyword =
        !keyword ||
        employee.name.includes(keyword) ||
        employee.username.includes(keyword);
      return matchesTeam && matchesRegion && matchesKeyword;
    });
  });

  /** 概览统计：可见人数 / 请假记录数 / 风险日数 / 峰值日 */
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

  // ─── 数据加载 ──────────────────────────────────────────────────────────────

  async function fetchCalendar() {
    loading.value = true;
    try {
      const params: Record<string, string> = {
        year: String(currentYear.value),
      };
      if (searchForm.team && searchForm.team !== 'all')
        params.team = searchForm.team;
      if (searchForm.region && searchForm.region !== 'all')
        params.region = searchForm.region;
      if (searchForm.employee_keyword)
        params.employee_keyword = searchForm.employee_keyword;
      if (searchForm.approval_status && searchForm.approval_status !== 'all')
        params.approval_status = searchForm.approval_status;

      const data = await getLeaveCalendarApi(currentYear.value, params);
      // 已撤回的申请不再占用日历格子
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
      annualLeaveSummary.value = await getAnnualLeaveSummaryApi(
        currentYear.value,
      );
    } catch {
      annualLeaveSummary.value = null;
    }
  }

  async function loadSystemSettings() {
    try {
      const meta = await getLeaveCalendarMetaApi();
      regions.value = meta.regions || [];
      regionalHolidays.value = meta.regional_holidays || [];
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
        employeesDirectory.value.map((item) => item.team).filter(Boolean),
      );
      teams.value = [...teamSet].toSorted((a, b) =>
        a.localeCompare(b, 'zh-CN'),
      );
    } catch {
      employeesDirectory.value = [];
      teams.value = [];
    }
  }

  /** 首屏并行加载：日历、系统设置、员工目录、年假汇总、请假类型字典 */
  function loadAll() {
    return Promise.all([
      fetchCalendar(),
      loadSystemSettings(),
      loadEmployees(),
      loadAnnualLeaveSummary(),
      loadLeaveTypeLabels(),
    ]);
  }

  // ─── 交互 ──────────────────────────────────────────────────────────────────

  function onSelectDate(date: Date) {
    selectedDateKey.value = toUTC8DateKey(date);
  }

  /** 面板切换年份时，重新拉取该年的日历与年假汇总 */
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

  function updateSearchForm(value: CalendarSearchForm) {
    Object.assign(searchForm, value);
  }

  /** 当前选中的有效地区 key；「全部」与「未设置」不参与假日增删 */
  function getActiveRegionKey(): string {
    const { region } = searchForm;
    if (!region || region === 'all' || region === '__unset__') return '';
    return region;
  }

  function findSelectedHoliday() {
    const activeRegion = getActiveRegionKey();
    return regionalHolidays.value.find(
      (h) =>
        regionsMatch(h.region, activeRegion) &&
        h.date === selectedDateKey.value,
    );
  }

  /** 将选中日期标记为该地区假日 */
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
      // 错误提示由调用方（页面）统一处理
    }
  }

  /** 取消选中日期在该地区的假日标记 */
  async function removeHoliday() {
    const activeRegion = getActiveRegionKey();
    if (!activeRegion || !findSelectedHoliday()) return;
    try {
      await deleteRegionalHolidayApi({
        region: activeRegion,
        date: selectedDateKey.value,
      });
      await loadSystemSettings();
    } catch {
      // 错误提示由调用方（页面）统一处理
    }
  }

  onMounted(() => {
    loadAll();
  });

  return {
    // 状态
    annualLeaveSummary,
    calendarRecords,
    currentYear,
    employeesDirectory,
    loading,
    regionalHolidays,
    regions,
    searchForm,
    selectedDateKey,
    teams,
    // 派生
    dayMap,
    filteredEmployees,
    stats,
    // 方法
    fetchCalendar,
    loadAll,
    onPanelChange,
    onSelectDate,
    removeHoliday,
    resetFilters,
    setHoliday,
    updateSearchForm,
  };
}
