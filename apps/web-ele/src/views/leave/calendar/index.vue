<script lang="ts" setup>
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';

import {
  ElButton,
  ElCard,
  ElInput,
  ElMessage,
  ElSelect,
} from 'element-plus';

import {
  deleteRegionalHolidayApi,
  getEmployeesApi,
  getLeaveCalendarApi,
  getSystemSettingsApi,
  upsertRegionalHolidayApi,
} from '#/api';

const router = useRouter();
const loading = ref(false);

const currentTime = ref('');
let timer: null | number = null;

const currentYear = ref(new Date().getFullYear());
const selectedDateKey = ref('');

const searchForm = reactive({
  team: '',
  region: '',
  employee_keyword: '',
  approval_status: '',
  risk_threshold: 5,
  view_mode: 'standard',
});

const regions = ref<string[]>([]);
const teams = ref<string[]>([]);
const employeesDirectory = ref<any[]>([]);
const regionalHolidays = ref<any[]>([]);

const calendarRecords = ref<any[]>([]);

const monthNames = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const weekNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const leaveTypeConfig: Record<string, { color: string; label: string; }> = {
  annual: { label: '年假', color: '#60a5fa' },
  personal: { label: '事假', color: '#fb923c' },
  sick: { label: '病假', color: '#f87171' },
  lieu: { label: '调休', color: '#4ade80' },
  long: { label: '长假', color: '#a78bfa' },
};

const approvalStatusConfig: Record<string, { label: string; opacity: number }> = {
  approved: { label: '已通过', opacity: 1 },
  pending: { label: '待审批', opacity: 0.5 },
  rejected: { label: '已驳回', opacity: 0.45 },
  withdrawn: { label: '已撤回', opacity: 0.35 },
};

const sessionLabelMap: Record<string, string> = {
  full_day: '全天',
  morning: '上午',
  afternoon: '下午',
};

const holidayNameOptions = [
  '元旦',
  '春节',
  '清明节',
  '劳动节',
  '端午节',
  '中秋节',
  '国庆节',
  '圣诞节',
  '公众假期',
  '公司假期',
  '补休',
  '其他假期',
];

const selectedHolidayName = ref(holidayNameOptions[0]);

function getHolidayForDate(dateKey: string, region: string) {
  if (!region || !dateKey) return null;
  return regionalHolidays.value.find((h: any) => h.region === region && h.date === dateKey);
}

function getActiveRegionKey() {
  if (!searchForm.region || searchForm.region === '' || searchForm.region === 'all') return '';
  if (searchForm.region === '__unset__') return '';
  return searchForm.region;
}

async function setHoliday() {
  const activeRegion = getActiveRegionKey();
  const dateKey = selectedDateKey.value;
  const holidayName = selectedHolidayName.value;
  if (!activeRegion || !dateKey || !holidayName) {
    ElMessage.warning('请先选择地区和日期');
    return;
  }
  try {
    await upsertRegionalHolidayApi({
      region: activeRegion,
      date: dateKey,
      holiday_name: holidayName,
    });
    await loadSystemSettings();
    ElMessage.success('假期设置成功');
  } catch {
    ElMessage.error('设置失败');
  }
}

async function removeHoliday() {
  const activeRegion = getActiveRegionKey();
  const holiday = getHolidayForDate(selectedDateKey.value, activeRegion);
  if (!holiday) return;
  try {
    await deleteRegionalHolidayApi({
      region: activeRegion,
      date: selectedDateKey.value,
    });
    await loadSystemSettings();
    ElMessage.success('假期已取消');
  } catch {
    ElMessage.error('取消失败');
  }
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
    entries.sort((left: any, right: any) => left.employee_name.localeCompare(right.employee_name, 'zh-CN'));
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
    const matchesTeam = searchForm.team === '' || searchForm.team === 'all' || employee.team === searchForm.team;
    const matchesRegion = searchForm.region === '' || searchForm.region === 'all'
      || (searchForm.region === '__unset__' ? employee.region === '未设置地区' : employee.region === searchForm.region);
    const matchesKeyword = !keyword || employee.name.includes(keyword) || employee.username.includes(keyword);
    return matchesTeam && matchesRegion && matchesKeyword;
  });
});

const stats = computed(() => {
  const riskyDates = Object.entries(dayMap.value).filter(([, entries]) => entries.length >= searchForm.risk_threshold);
  const peak = riskyDates.toSorted((left, right) => right[1].length - left[1].length)[0];
  return {
    visibleEmployeeCount: filteredEmployees.value.length,
    leaveRecordCount: calendarRecords.value.length,
    riskDayCount: riskyDates.length,
    peakDayText: peak ? `${peak[0].slice(5)} · ${peak[1].length}人` : '-',
  };
});

const calendarMonths = computed(() => {
  return monthNames.map((monthName, monthIndex) => {
    const firstDay = new Date(currentYear.value, monthIndex, 1).getDay();
    const daysInMonth = new Date(currentYear.value, monthIndex + 1, 0).getDate();

    const cells: {
      dateKey: string;
      day: number;
      entries: any[];
      hasLeave: boolean;
      isEmpty: boolean;
      isHighlighted: boolean;
      isRisk: boolean;
      isSelected: boolean;
      isWeekend: boolean;
    }[] = [];

    for (let i = 0; i < firstDay; i++) {
      cells.push({ day: 0, isEmpty: true, isWeekend: false, hasLeave: false, isSelected: false, isRisk: false, isHighlighted: false, dateKey: '', entries: [] });
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = `${currentYear.value}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const entries = dayMap.value[dateKey] || [];
      const currentDate = new Date(currentYear.value, monthIndex, day);
      const isWeekend = currentDate.getDay() === 0 || currentDate.getDay() === 6;
      const isSelected = selectedDateKey.value === dateKey;
      const isRisk = entries.length >= searchForm.risk_threshold;

      const keyword = searchForm.employee_keyword.trim();
      const isHighlighted = keyword && entries.some((e: any) => e.employee_name.includes(keyword));

      cells.push({
        day,
        isEmpty: false,
        isWeekend,
        hasLeave: entries.length > 0,
        isSelected,
        isRisk,
        isHighlighted: Boolean(isHighlighted),
        dateKey,
        entries,
      });
    }

    const rows: {
      dateKey: string;
      day: number;
      entries: any[];
      hasLeave: boolean;
      isEmpty: boolean;
      isHighlighted: boolean;
      isRisk: boolean;
      isSelected: boolean;
      isWeekend: boolean;
    }[][] = [];
    for (let i = 0; i < cells.length; i += 7) {
      rows.push(cells.slice(i, i + 7));
    }

    return { monthName, rows };
  });
});

interface CalendarDetail {
  title: string;
  content: string | { grouped: Record<string, any[]>; holiday: any; };
  isEmpty: boolean;
}

const calendarDetail = computed<CalendarDetail>(() => {
  if (!selectedDateKey.value) {
    return { title: '日期详情', content: '点击任意日期格子后，这里会显示当天请假人员清单、假期类型、时段和审批状态。', isEmpty: true };
  }

  const entries = dayMap.value[selectedDateKey.value] || [];
  const activeRegion = searchForm.region && searchForm.region !== 'all' ? searchForm.region : '';
  const holiday = activeRegion ? regionalHolidays.value.find((h: any) => h.region === activeRegion && h.date === selectedDateKey.value) : null;

  if (entries.length === 0 && !holiday) {
    return { title: `${selectedDateKey.value} · 日期详情`, content: '当天暂无请假记录，可作为正常出勤日期。', isEmpty: true };
  }

  const grouped: Record<string, any[]> = {};
  entries.forEach((entry: any) => {
    const leaveType = entry.leave_type;
    if (!leaveType) return;
    grouped[leaveType] = grouped[leaveType] || [];
    grouped[leaveType].push(entry);
  });

  return {
    title: `${selectedDateKey.value} · 请假详情`,
    content: {
      holiday,
      grouped,
    },
    isEmpty: false,
  };
});

function formatNow() {
  const now = new Date();
  const weekLabels = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds} ${weekLabels[now.getDay()]}`;
}

function startLiveClock() {
  currentTime.value = formatNow();
  timer = window.setInterval(() => {
    currentTime.value = formatNow();
  }, 1000);
}

function getLeaveTypeColor(type: string, status: string) {
  const baseColor = leaveTypeConfig[type]?.color || '#94a3b8';
  const opacity = approvalStatusConfig[status]?.opacity ?? 1;
  if (opacity === 1) return baseColor;
  const hex = baseColor.replace('#', '');
  const red = Number.parseInt(hex.slice(0, 2), 16);
  const green = Number.parseInt(hex.slice(2, 4), 16);
  const blue = Number.parseInt(hex.slice(4, 6), 16);
  return `rgba(${red}, ${green}, ${blue}, ${opacity})`;
}

function getSessionShortLabel(session: string) {
  if (session === 'morning') return '上';
  if (session === 'afternoon') return '下';
  return '';
}

function getDisplayLimit(entryCount: number) {
  if (searchForm.view_mode === 'detail') return 4;
  if (entryCount <= 2) return 2;
  if (entryCount <= 4) return 3;
  return 2;
}

function changeYear(delta: number) {
  currentYear.value += delta;
  selectedDateKey.value = '';
}

function goToCurrentYear() {
  currentYear.value = new Date().getFullYear();
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

async function fetchCalendar() {
  loading.value = true;
  try {
    const params: Record<string, string> = { year: String(currentYear.value) };
    if (searchForm.team && searchForm.team !== 'all') params.team = searchForm.team;
    if (searchForm.region && searchForm.region !== 'all') params.region = searchForm.region;
    if (searchForm.employee_keyword) params.employee_keyword = searchForm.employee_keyword;
    if (searchForm.approval_status && searchForm.approval_status !== 'all') params.approval_status = searchForm.approval_status;

    const data = await getLeaveCalendarApi(currentYear.value, params);
    calendarRecords.value = (data.items || []).filter((item: any) => item.approval_status !== 'withdrawn');
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
    employeesDirectory.value = data.map((item: any) => ({
      id: item.id,
      username: item.username,
      name: item.full_name || item.username,
      team: item.department || '未分组',
      region: item.region || '未设置地区',
      isActive: item.is_active !== false,
    })).filter((item: any) => item.isActive);

    const teamSet = new Set(employeesDirectory.value.map((item: any) => item.team).filter(Boolean));
    teams.value = [...teamSet].toSorted((a: string, b: string) => a.localeCompare(b, 'zh-CN'));
  } catch {
    employeesDirectory.value = [];
    teams.value = [];
  }
}

function goBackHome() {
  router.push('/dashboard/workspace');
}

function goToWorkflow() {
  router.push('/leave/workflow');
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
    <div class="page-header">
      <div class="header-info">
        <h2>请假管理</h2>
        <p class="page-subtitle">请假管理包含“请假日历”和“流程维护”，当前为日历视图。</p>
        <div class="live-time">{{ currentTime }}</div>
      </div>
      <div class="header-actions">
        <ElButton @click="goBackHome">返回工作台</ElButton>
        <div class="toolbar-filter">
          <span class="toolbar-label">地区日历</span>
          <ElSelect v-model="searchForm.region" class="toolbar-select">
            <ElOption label="总览（全部地区）" value="" />
            <ElOption label="未设置地区" value="__unset__" />
            <ElOption v-for="r in regions" :key="r" :label="r" :value="r" />
          </ElSelect>
        </div>
        <ElButton @click="changeYear(-1)">上一年</ElButton>
        <span class="year-badge">{{ currentYear }}</span>
        <ElButton @click="changeYear(1)">下一年</ElButton>
        <ElButton type="primary" @click="goToCurrentYear">回到今年</ElButton>
      </div>
    </div>

    <div class="subnav">
      <span class="subnav-link active">请假日历</span>
      <span class="subnav-link" @click="goToWorkflow">流程维护</span>
    </div>

    <div class="stats-grid">
      <ElCard class="stat-card">
        <div class="stat-label">当前展示成员</div>
        <div class="stat-value">{{ stats.visibleEmployeeCount }}</div>
      </ElCard>
      <ElCard class="stat-card">
        <div class="stat-label">全年请假记录</div>
        <div class="stat-value">{{ stats.leaveRecordCount }}</div>
      </ElCard>
      <ElCard class="stat-card">
        <div class="stat-label">风险日期数量</div>
        <div class="stat-value">{{ stats.riskDayCount }}</div>
      </ElCard>
      <ElCard class="stat-card">
        <div class="stat-label">最高峰值日期</div>
        <div class="stat-value">{{ stats.peakDayText }}</div>
      </ElCard>
    </div>

    <ElCard class="card control-panel">
      <template #header>
        <h3>筛选控制</h3>
      </template>

      <div class="control-grid">
        <div class="control-item">
          <label>团队筛选</label>
          <ElSelect v-model="searchForm.team" placeholder="全部成员" clearable>
            <ElOption label="全部成员" value="" />
            <ElOption v-for="t in teams" :key="t" :label="t" :value="t" />
          </ElSelect>
        </div>
        <div class="control-item">
          <label>员工搜索</label>
          <ElInput v-model="searchForm.employee_keyword" placeholder="输入姓名高亮全年请假" />
        </div>
        <div class="control-item">
          <label>人力预警阈值</label>
          <ElInput v-model.number="searchForm.risk_threshold" type="number" :min="1" :max="20" />
        </div>
        <div class="control-item">
          <label>视图模式</label>
          <div class="view-toggle">
            <ElButton :class="{ active: searchForm.view_mode === 'standard' }" @click="searchForm.view_mode = 'standard'">标准</ElButton>
            <ElButton :class="{ active: searchForm.view_mode === 'detail' }" @click="searchForm.view_mode = 'detail'">明细</ElButton>
          </div>
        </div>
        <div class="control-item">
          <label>审批状态</label>
          <ElSelect v-model="searchForm.approval_status">
            <ElOption label="全部状态" value="" />
            <ElOption label="仅已通过" value="approved" />
            <ElOption label="仅待审批" value="pending" />
          </ElSelect>
        </div>
        <div class="control-item">
          <label>&nbsp;</label>
          <ElButton @click="resetFilters">重置筛选</ElButton>
        </div>
      </div>

      <div class="legend">
        <div v-for="(config, type) in leaveTypeConfig" :key="type" class="legend-item">
          <span class="legend-dot" :style="{ background: config.color }"></span>
          {{ config.label }}
        </div>
        <div class="legend-item">
          <span class="legend-swatch" style="background:#f1f5f9;"></span>
          周末/节假日底色
        </div>
        <div class="legend-item">
          <span class="legend-swatch" style="background:rgba(96, 165, 250, 0.5);"></span>
          待审批为半透明
        </div>
        <div class="legend-item">
          <span class="legend-swatch" style="background:#ede9fe;"></span>
          地区假期
        </div>
        <div class="legend-item">
          <span class="legend-swatch" style="background:#ffffff;border:2px solid #ef4444;"></span>
          达到预警阈值
        </div>
      </div>
    </ElCard>

    <ElCard class="card calendar-panel">
      <template #header>
        <h3>年历视图</h3>
      </template>

      <div class="calendar-grid" :class="[searchForm.view_mode === 'detail' ? 'detail-mode' : '']">
        <div v-for="(month, index) in calendarMonths" :key="index" class="month-card">
          <h4 class="month-title">{{ month.monthName }}</h4>
          <table class="month-table">
            <thead>
              <tr>
                <th v-for="day in weekNames" :key="day">{{ day }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, rowIndex) in month.rows" :key="rowIndex">
                <td v-for="(cell, cellIndex) in row" :key="cellIndex" class="day-cell" :class="[{ empty: cell.isEmpty }]">
                  <div
                    v-if="!cell.isEmpty"
                    class="calendar-day" :class="[{
                      weekend: cell.isWeekend,
                      'has-leave': cell.hasLeave,
                      selected: cell.isSelected,
                      risk: cell.isRisk,
                      'is-highlighted': cell.isHighlighted,
                    }]"
                    @click="selectedDateKey = cell.dateKey"
                  >
                    <div class="calendar-day-top">
                      <span class="day-number">{{ cell.day }}</span>
                      <span v-if="cell.entries.length" class="day-badge">{{ cell.entries.length }}</span>
                    </div>
                    <div class="leave-list">
                      <div
                        v-for="(entry, entryIndex) in cell.entries.slice(0, getDisplayLimit(cell.entries.length))"
                        :key="entryIndex"
                        class="leave-item" :class="[{ dimmed: entry.approval_status === 'pending' }]"
                      >
                        <span class="type-dot" :style="{ background: getLeaveTypeColor(entry.leave_type, entry.approval_status) }"></span>
                        <span class="leave-name">{{ entry.employee_name }}</span>
                        <span v-if="getSessionShortLabel(entry.session)" class="leave-session">
                          {{ getSessionShortLabel(entry.session) }}
                        </span>
                      </div>
                      <div v-if="cell.entries.length > getDisplayLimit(cell.entries.length)" class="more-line">
                        +{{ cell.entries.length - getDisplayLimit(cell.entries.length) }}
                      </div>
                    </div>
                    <div v-if="cell.entries.length" class="day-bars">
                      <span
                        v-for="type in [...new Set(cell.entries.map((e: any) => e.leave_type))]"
                        :key="type"
                        class="day-bar"
                        :style="{ background: getLeaveTypeColor(type, 'approved') }"
                      ></span>
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="hint">
        当前已切换为真实后端数据版本：直接读取 MongoDB 请假记录生成年历，默认模式下尽量直显请假人员，超出时用 <code>+N人</code> 收口；点击日期可看当天详细明细。
      </div>
    </ElCard>

    <ElCard class="card detail-panel">
      <div class="detail-section">
        <h3>{{ calendarDetail.title }}</h3>
        <div v-if="calendarDetail.isEmpty" class="detail-empty">{{ calendarDetail.content }}</div>
        <div v-else>
          <div v-if="(calendarDetail.content as any).holiday" class="detail-group">
            <div class="detail-group-header">
              <span style="color:#6d28d9;">地区假期</span>
              <span>{{ (calendarDetail.content as any).holiday.holiday_name }}</span>
            </div>
            <div class="detail-row">
              <div>{{ (calendarDetail.content as any).holiday.region }}</div>
              <div class="detail-row-meta">{{ (calendarDetail.content as any).holiday.date }}</div>
            </div>
          </div>
          <div v-for="(entries, type) in (calendarDetail.content as any).grouped" :key="String(type)" class="detail-group">
            <div class="detail-group-header">
              <span :style="{ color: getLeaveTypeColor(String(type), 'approved') }">{{ leaveTypeConfig[String(type)]?.label || type }}</span>
              <span>{{ entries.length }} 人</span>
            </div>
            <div v-for="entry in entries" :key="entry.id" class="detail-row">
              <div>{{ entry.employee_name }} · {{ entry.employee_department || '未分组' }}</div>
              <div class="detail-row-meta">{{ sessionLabelMap[entry.session] || '全天' }} · {{ approvalStatusConfig[entry.approval_status]?.label || entry.approval_status }}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="detail-section">
        <h3>地区假期维护</h3>
        <div class="holiday-manager">
          <div v-if="!selectedDateKey || !getActiveRegionKey()" class="detail-empty">
            请先在上方选择具体地区，再点击某一天设置该地区的假期。
          </div>
          <div v-else>
            <div class="holiday-manager-title">{{ getActiveRegionKey() }} · {{ selectedDateKey }}</div>
            <div class="holiday-manager-status">
              <template v-if="getHolidayForDate(selectedDateKey, getActiveRegionKey())">
                当前已设置假期：{{ getHolidayForDate(selectedDateKey, getActiveRegionKey())?.holiday_name }}
              </template>
              <template v-else>
                当前未设置地区假期。
              </template>
            </div>
            <div class="holiday-manager-controls">
              <ElSelect v-model="selectedHolidayName" class="holiday-select">
                <ElOption v-for="name in holidayNameOptions" :key="name" :label="name" :value="name" />
              </ElSelect>
              <ElButton type="primary" @click="setHoliday">设置假期</ElButton>
              <ElButton @click="removeHoliday" :disabled="!getHolidayForDate(selectedDateKey, getActiveRegionKey())">
                取消设置
              </ElButton>
            </div>
          </div>
        </div>
      </div>

      <div class="detail-section">
        <h3>使用说明</h3>
        <div class="summary-list">
          <div class="summary-item">
            <strong>总览阅读</strong>
            每天格子直接显示请假姓名，前置色点表示假期类型，右上角徽标显示当天总请假人数。
          </div>
          <div class="summary-item">
            <strong>预警规则</strong>
            单日请假人数达到阈值后，会对日期格子加红框，帮助你快速识别人力紧张日期。
          </div>
          <div class="summary-item">
            <strong>筛选方式</strong>
            支持按团队看全年排期，也支持搜索某个员工，直接高亮他全年所有请假日期。
          </div>
          <div class="summary-item">
            <strong>后续接入</strong>
            当前已经接入真实请假日历接口，后续可以继续补录入、审批和点击日期快速操作能力。
          </div>
        </div>
      </div>
    </ElCard>
  </div>
</template>

<style scoped>
.leave-calendar-page {
  padding: 32px;
  background: #f8fafc;
  min-height: calc(100vh - 80px);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 18px;
}

.header-info h2 {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
}

.page-subtitle {
  margin: 8px 0 0;
  color: #64748b;
  font-size: 14px;
}

.live-time {
  margin-top: 10px;
  color: #2563eb;
  font-size: 14px;
  font-weight: 700;
}

.header-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  justify-content: flex-end;
}

.toolbar-filter {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 12px;
  background: #ffffff;
  border: 1px solid #cbd5e1;
}

.toolbar-label {
  font-size: 13px;
  font-weight: 700;
  color: #334155;
  white-space: nowrap;
}

.toolbar-select {
  border: 0;
  background: transparent;
  font-weight: 700;
  color: #0f172a;
  padding: 0;
  min-width: 180px;
}

.year-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 88px;
  padding: 10px 14px;
  border-radius: 10px;
  background: #e2e8f0;
  color: #0f172a;
  font-weight: 700;
}

.subnav {
  display: inline-flex;
  gap: 10px;
  margin: 6px 0 18px;
  padding: 6px;
  border-radius: 14px;
  background: #e2e8f0;
}

.subnav-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 10px 14px;
  border-radius: 12px;
  color: #0f172a;
  font-weight: 700;
  font-size: 14px;
  cursor: pointer;
}

.subnav-link.active {
  background: #2563eb;
  color: #fff;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
  margin-bottom: 18px;
}

.stat-card {
  border-radius: 16px;
  padding: 18px 20px;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08);
}

.stat-label {
  color: #64748b;
  font-size: 13px;
}

.stat-value {
  margin-top: 10px;
  font-size: 24px;
  font-weight: 700;
}

.card {
  border-radius: 16px;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08);
}

.card :deep(.el-card__header) {
  padding: 0 0 16px;
  border-bottom: none;
}

.card :deep(.el-card__header) h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
}

.card :deep(.el-card__body) {
  padding: 0;
}

.control-panel {
  margin-bottom: 18px;
}

.control-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 14px;
  align-items: end;
}

.control-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.control-item label {
  font-size: 13px;
  font-weight: 700;
  color: #334155;
}

.view-toggle {
  display: flex;
  gap: 8px;
}

.view-toggle :deep(.el-button) {
  background: #e2e8f0;
  color: #0f172a;
}

.view-toggle :deep(.el-button.active) {
  background: #2563eb;
  color: #fff;
}

.legend {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 14px;
  margin-top: 16px;
}

.legend-item {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #475569;
  font-size: 13px;
}

.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  flex: 0 0 auto;
}

.legend-swatch {
  width: 18px;
  height: 10px;
  border-radius: 999px;
  flex: 0 0 auto;
}

.calendar-panel {
  margin-bottom: 18px;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 22px 18px;
}

.calendar-grid.detail-mode {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.month-card {
  min-width: 0;
}

.month-title {
  margin: 0 0 10px;
  font-size: 18px;
  font-weight: 700;
}

.month-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
  background: #fff;
}

.month-table th {
  height: 30px;
  border: 1px solid #d1d5db;
  background: #f8fafc;
  color: #334155;
  font-size: 12px;
  font-weight: 700;
}

.month-table td {
  width: 14.285%;
  border: 1px solid #d1d5db;
  padding: 0;
  vertical-align: top;
}

.day-cell.empty {
  background: #f8fafc;
}

.calendar-day {
  position: relative;
  min-height: 82px;
  padding: 6px 6px 16px;
  cursor: pointer;
  background: #ffffff;
  transition: background 0.16s ease, box-shadow 0.16s ease;
}

.calendar-grid.detail-mode .calendar-day {
  min-height: 108px;
}

.calendar-day:hover {
  background: #f8fbff;
}

.calendar-day.selected {
  box-shadow: inset 0 0 0 2px #2563eb;
  background: #eff6ff;
}

.calendar-day.weekend {
  background: #f1f5f9;
}

.calendar-day.risk {
  box-shadow: inset 0 0 0 2px #ef4444;
}

.calendar-day.is-highlighted {
  box-shadow: inset 0 0 0 2px #22c55e;
}

.calendar-day-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 6px;
  margin-bottom: 4px;
}

.day-number {
  font-size: 12px;
  font-weight: 700;
}

.day-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 34px;
  padding: 2px 6px;
  border-radius: 999px;
  background: #dbeafe;
  color: #1d4ed8;
  font-size: 11px;
  font-weight: 700;
}

.leave-list {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-height: 50px;
}

.leave-item {
  display: flex;
  align-items: center;
  gap: 5px;
  min-width: 0;
  padding: 1px 0;
  font-size: 12px;
  line-height: 1.25;
}

.leave-item.dimmed {
  opacity: 0.72;
}

.type-dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  flex: 0 0 auto;
}

.leave-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
}

.leave-session {
  color: #64748b;
  font-size: 10px;
  flex: 0 0 auto;
}

.more-line {
  margin-top: 2px;
  color: #475569;
  font-size: 11px;
  font-weight: 700;
}

.day-bars {
  position: absolute;
  left: 6px;
  right: 6px;
  bottom: 5px;
  display: flex;
  gap: 3px;
  height: 6px;
}

.day-bar {
  flex: 1;
  border-radius: 999px;
}

.hint {
  margin-top: 16px;
  color: #64748b;
  font-size: 13px;
  line-height: 1.7;
}

.detail-panel {
  display: grid;
  grid-template-columns: 1.2fr 0.8fr;
  gap: 18px;
}

.detail-section h3 {
  margin: 0 0 12px;
  font-size: 18px;
}

.detail-empty {
  padding: 18px;
  border-radius: 14px;
  background: #f8fafc;
  color: #64748b;
  font-size: 14px;
  line-height: 1.7;
}

.detail-group {
  margin-bottom: 12px;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  overflow: hidden;
}

.detail-group-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  background: #f8fafc;
  font-weight: 700;
  font-size: 14px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  border-top: 1px solid #e2e8f0;
  font-size: 14px;
}

.detail-row-meta {
  color: #64748b;
  text-align: right;
  white-space: nowrap;
}

.summary-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.summary-item {
  padding: 12px 14px;
  border-radius: 14px;
  background: #f8fafc;
  font-size: 14px;
  color: #334155;
}

.summary-item strong {
  display: block;
  margin-bottom: 4px;
  color: #0f172a;
}

.holiday-manager {
  margin-top: 16px;
  padding: 14px;
  border-radius: 14px;
  background: #f8fafc;
}

.holiday-manager-title {
  font-weight: 700;
}

.holiday-manager-status {
  margin-top: 10px;
  font-size: 13px;
  color: #475569;
  line-height: 1.7;
}

.holiday-manager-controls {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto;
  gap: 10px;
  margin-top: 12px;
  align-items: center;
}

.holiday-select {
  width: 100%;
}

@media (max-width: 1440px) {
  .control-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 1280px) {
  .stats-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .calendar-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
  .calendar-grid.detail-mode {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .detail-panel {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 980px) {
  .page-header {
    flex-direction: column;
  }
  .header-actions {
    justify-content: flex-start;
  }
  .control-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .calendar-grid,
  .calendar-grid.detail-mode {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .stats-grid,
  .control-grid,
  .calendar-grid,
  .calendar-grid.detail-mode {
    grid-template-columns: 1fr;
  }
}
</style>
