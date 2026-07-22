<script lang="ts" setup>
import type { LeaveRequestApi } from '#/api';

import { computed, reactive, ref } from 'vue';

import {
  ElButton,
  ElCard,
  ElForm,
  ElFormItem,
  ElInput,
  ElSelect,
  ElTable,
  ElTableColumn,
  ElTag,
} from 'element-plus';

import { getLeaveCalendarApi } from '#/api';

const loading = ref(false);
const calendarData = ref<LeaveRequestApi.LeaveCalendar | null>(null);

const currentYear = ref(new Date().getFullYear());

const searchForm = reactive({
  team: '',
  region: '',
  employee_keyword: '',
  approval_status: '',
});

const leaveTypeOptions: Record<string, string> = {
  sick: '病假',
  annual: '年假',
  personal: '事假',
  lieu: '调休',
  long: '长假',
};

const statusOptions: Record<string, string> = {
  pending: '待审批',
  approved: '已批准',
  rejected: '已拒绝',
  withdrawn: '已撤回',
};

const statusTypeMap: Record<string, 'success' | 'warning' | 'danger' | 'info'> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'danger',
  withdrawn: 'info',
};

const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];

const weeks = ['日', '一', '二', '三', '四', '五', '六'];

const currentMonth = ref(new Date().getMonth());

const calendarGrid = computed(() => {
  if (!calendarData.value) return [];

  const year = currentYear.value;
  const month = currentMonth.value;
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDay = firstDay.getDay();
  const totalDays = lastDay.getDate();

  const grid: {
    day: number;
    date: string;
    isCurrentMonth: boolean;
    leaveRequests: LeaveRequestApi.LeaveRequest[];
  }[][] = [];

  const dateToRequests = new Map<string, LeaveRequestApi.LeaveRequest[]>();
  calendarData.value.items.forEach((req) => {
    req.date_keys.forEach((dateKey) => {
      if (!dateToRequests.has(dateKey)) {
        dateToRequests.set(dateKey, []);
      }
      dateToRequests.get(dateKey)!.push(req);
    });
  });

  let week: typeof grid[0] = [];
  for (let i = 0; i < startDay; i++) {
    week.push({ day: 0, date: '', isCurrentMonth: false, leaveRequests: [] });
  }

  for (let day = 1; day <= totalDays; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    week.push({
      day,
      date: dateStr,
      isCurrentMonth: true,
      leaveRequests: dateToRequests.get(dateStr) || [],
    });

    if (week.length === 7) {
      grid.push(week);
      week = [];
    }
  }

  if (week.length > 0) {
    while (week.length < 7) {
      week.push({ day: 0, date: '', isCurrentMonth: false, leaveRequests: [] });
    }
    grid.push(week);
  }

  return grid;
});

async function fetchCalendar() {
  loading.value = true;
  try {
    calendarData.value = await getLeaveCalendarApi(currentYear.value, {
      team: searchForm.team || undefined,
      region: searchForm.region || undefined,
      employee_keyword: searchForm.employee_keyword || undefined,
      approval_status: searchForm.approval_status || undefined,
    });
  } finally {
    loading.value = false;
  }
}

function prevMonth() {
  if (currentMonth.value === 0) {
    currentMonth.value = 11;
    currentYear.value--;
  } else {
    currentMonth.value--;
  }
}

function nextMonth() {
  if (currentMonth.value === 11) {
    currentMonth.value = 0;
    currentYear.value++;
  } else {
    currentMonth.value++;
  }
}

function goToToday() {
  const now = new Date();
  currentYear.value = now.getFullYear();
  currentMonth.value = now.getMonth();
}

function handleSearch() {
  fetchCalendar();
}

function handleReset() {
  searchForm.team = '';
  searchForm.region = '';
  searchForm.employee_keyword = '';
  searchForm.approval_status = '';
  fetchCalendar();
}

fetchCalendar();
</script>

<template>
  <div class="leave-calendar-page">
    <div class="page-header">
      <h2>请假日历</h2>
    </div>

    <ElCard class="calendar-card">
      <div class="calendar-header">
        <div class="nav-buttons">
          <ElButton size="small" @click="prevMonth">‹</ElButton>
          <span class="month-title">{{ currentYear }}年 {{ monthNames[currentMonth] }}</span>
          <ElButton size="small" @click="nextMonth">›</ElButton>
          <ElButton size="small" @click="goToToday">今天</ElButton>
        </div>
      </div>

      <div class="calendar-grid">
        <div class="calendar-weekdays">
          <div v-for="(day, index) in weeks" :key="index" class="weekday">{{ day }}</div>
        </div>
        <div v-for="(week, weekIndex) in calendarGrid" :key="weekIndex" class="calendar-week">
          <div
            v-for="(day, dayIndex) in week"
            :key="dayIndex"
            class="calendar-day"
            :class="{ 'other-month': !day.isCurrentMonth }"
          >
            <span v-if="day.isCurrentMonth" class="day-number">{{ day.day }}</span>
            <div v-if="day.leaveRequests.length > 0" class="leave-indicators">
              <div
                v-for="(req, reqIndex) in day.leaveRequests.slice(0, 3)"
                :key="reqIndex"
                class="leave-indicator"
                :class="[req.approval_status]"
                :title="`${req.employee_name}: ${leaveTypeOptions[req.leave_type]} - ${statusOptions[req.approval_status]}`"
              />
              <span v-if="day.leaveRequests.length > 3" class="more-indicator">
                +{{ day.leaveRequests.length - 3 }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div class="legend">
        <div class="legend-item">
          <span class="legend-dot approved"></span>
          <span>已批准</span>
        </div>
        <div class="legend-item">
          <span class="legend-dot pending"></span>
          <span>待审批</span>
        </div>
        <div class="legend-item">
          <span class="legend-dot rejected"></span>
          <span>已拒绝</span>
        </div>
        <div class="legend-item">
          <span class="legend-dot withdrawn"></span>
          <span>已撤回</span>
        </div>
      </div>
    </ElCard>

    <ElCard class="filter-card" header="筛选条件">
      <ElForm :model="searchForm" inline>
        <ElFormItem label="员工关键词">
          <ElInput
            v-model="searchForm.employee_keyword"
            placeholder="搜索员工姓名"
            style="width: 200px"
            clearable
          />
        </ElFormItem>
        <ElFormItem label="部门">
          <ElSelect
            v-model="searchForm.team"
            placeholder="请选择"
            style="width: 150px"
            clearable
          >
            <ElOption label="技术部" value="技术部" />
            <ElOption label="人事部" value="人事部" />
            <ElOption label="财务部" value="财务部" />
            <ElOption label="市场部" value="市场部" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="区域">
          <ElSelect
            v-model="searchForm.region"
            placeholder="请选择"
            style="width: 120px"
            clearable
          >
            <ElOption label="北京" value="北京" />
            <ElOption label="上海" value="上海" />
            <ElOption label="广州" value="广州" />
            <ElOption label="深圳" value="深圳" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="状态">
          <ElSelect
            v-model="searchForm.approval_status"
            placeholder="请选择"
            style="width: 120px"
            clearable
          >
            <ElOption label="待审批" value="pending" />
            <ElOption label="已批准" value="approved" />
            <ElOption label="已拒绝" value="rejected" />
            <ElOption label="已撤回" value="withdrawn" />
          </ElSelect>
        </ElFormItem>
        <ElButton type="primary" @click="handleSearch">搜索</ElButton>
        <ElButton @click="handleReset">重置</ElButton>
      </ElForm>
    </ElCard>

    <ElCard class="list-card" header="本月请假列表">
      <ElTable :data="calendarData?.items || []" border stripe v-loading="loading" size="small">
        <ElTableColumn prop="employee_name" label="员工" width="100" />
        <ElTableColumn prop="employee_department" label="部门" width="100" />
        <ElTableColumn prop="leave_type" label="类型" width="80">
          <template #default="{ row }">
            {{ leaveTypeOptions[row.leave_type] }}
          </template>
        </ElTableColumn>
        <ElTableColumn prop="start_date" label="开始" width="120" />
        <ElTableColumn prop="end_date" label="结束" width="120" />
        <ElTableColumn prop="approval_status" label="状态" width="100">
          <template #default="{ row }">
            <ElTag :type="statusTypeMap[row.approval_status]">
              {{ statusOptions[row.approval_status] }}
            </ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="reason" label="原因" min-width="150" show-overflow-tooltip />
      </ElTable>
    </ElCard>
  </div>
</template>

<style scoped>
.leave-calendar-page {
  padding: 24px;
  background: #f5f5f5;
  min-height: calc(100vh - 80px);
}

.page-header {
  margin-bottom: 20px;
}

.page-header h2 {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.calendar-card {
  margin-bottom: 20px;
}

.calendar-header {
  margin-bottom: 20px;
}

.nav-buttons {
  display: flex;
  align-items: center;
  gap: 12px;
}

.month-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.calendar-grid {
  margin-bottom: 20px;
}

.calendar-weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  text-align: center;
  padding-bottom: 12px;
  border-bottom: 1px solid #e4e7ed;
}

.weekday {
  font-weight: 600;
  color: #606266;
  padding: 8px 0;
}

.calendar-week {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
}

.calendar-day {
  aspect-ratio: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding: 8px 4px;
  border: 1px solid #f0f0f0;
  transition: all 0.2s;
}

.calendar-day:hover {
  background: #f5f7fa;
}

.calendar-day.other-month {
  background: #fafafa;
  color: #c0c4cc;
}

.day-number {
  font-size: 14px;
  color: #303133;
  margin-bottom: 4px;
}

.leave-indicators {
  display: flex;
  flex-wrap: wrap;
  gap: 2px;
  justify-content: center;
}

.leave-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.leave-indicator.approved {
  background: #67c23a;
}

.leave-indicator.pending {
  background: #e6a23c;
}

.leave-indicator.rejected {
  background: #f56c6c;
}

.leave-indicator.withdrawn {
  background: #909399;
}

.more-indicator {
  font-size: 10px;
  color: #909399;
}

.legend {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  justify-content: center;
  padding-top: 16px;
  border-top: 1px solid #e4e7ed;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #606266;
}

.legend-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.legend-dot.approved {
  background: #67c23a;
}

.legend-dot.pending {
  background: #e6a23c;
}

.legend-dot.rejected {
  background: #f56c6c;
}

.legend-dot.withdrawn {
  background: #909399;
}

.filter-card {
  margin-bottom: 20px;
}

.list-card {
  overflow-x: auto;
}
</style>
