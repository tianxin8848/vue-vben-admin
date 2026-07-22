<script lang="ts" setup>
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';

import {
  ElButton,
  ElCard,
  ElDatePicker,
  ElForm,
  ElFormItem,
  ElInput,
  ElMessage,
  ElMessageBox,
  ElSelect,
  ElTag,
} from 'element-plus';

import {
  createLeaveRequestApi,
  getAnnualLeaveSummaryApi,
  getMyLeaveRequestsApi,
  getUserInfoApi,
  withdrawLeaveRequestApi,
} from '#/api';

const router = useRouter();
const loading = ref(false);

const currentTime = ref('');
let timer: null | number = null;

const userInfo = ref<null | {
  department: null | string;
  full_name: string;
  is_admin: boolean;
  username: string;
}>(null);

const allLeaveItems = ref<any[]>([]);
const visibleLeaveItems = ref<any[]>([]);
const hideWithdrawnOrRejected = ref(false);

const currentYear = ref(new Date().getFullYear());
const selectedDateKey = ref('');

const annualLeaveSummary = ref<null | {
  available_days: number;
  entitlement_days: number;
  used_days: number;
}>(null);

const leaveTypeOptions = [
  { label: '年假', value: 'annual' },
  { label: '事假', value: 'personal' },
  { label: '病假', value: 'sick' },
  { label: '调休', value: 'lieu' },
  { label: '长假', value: 'long' },
];

const sessionOptions = [
  { label: '全天', value: 'full_day' },
  { label: '上午', value: 'morning' },
  { label: '下午', value: 'afternoon' },
];

const leaveTypeLabelMap: Record<string, string> = {
  annual: '年假',
  personal: '事假',
  sick: '病假',
  lieu: '调休',
  long: '长假',
};

const leaveStatusLabelMap: Record<string, string> = {
  pending: '待审批',
  approved: '已通过',
  rejected: '已驳回',
  withdrawn: '已撤回',
};

const leaveSessionLabelMap: Record<string, string> = {
  full_day: '全天',
  morning: '上午',
  afternoon: '下午',
};

const leaveTypeColorMap: Record<string, string> = {
  annual: '#60a5fa',
  personal: '#fb923c',
  sick: '#f87171',
  lieu: '#4ade80',
  long: '#a78bfa',
};

const createForm = reactive({
  leave_type: 'annual',
  start_date: '',
  end_date: '',
  session: 'full_day',
  handover_to: '',
  reason: '',
});

const formMessage = ref('');
const formMessageType = ref<'' | 'error' | 'success'>('');

const yearRecordCount = computed(() => {
  return visibleLeaveItems.value.filter((item) => {
    const dateKeys = item.date_keys || [];
    return dateKeys.some((key: string) => key.startsWith(`${currentYear.value}-`));
  }).length;
});

const yearDayCount = computed(() => {
  const daySet = new Set<string>();
  visibleLeaveItems.value.forEach((item) => {
    (item.date_keys || []).forEach((key: string) => {
      if (key.startsWith(`${currentYear.value}-`)) {
        daySet.add(key);
      }
    });
  });
  return daySet.size;
});

const yearPendingCount = computed(() => {
  return visibleLeaveItems.value.filter(
    (item) =>
      item.approval_status === 'pending' &&
      (item.date_keys || []).some((key: string) => key.startsWith(`${currentYear.value}-`)),
  ).length;
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

function showFormMessage(text: string, type: 'error' | 'success') {
  formMessage.value = text;
  formMessageType.value = type;
}

function clearFormMessage() {
  formMessage.value = '';
  formMessageType.value = '';
}

function formatDateRange(item: any) {
  if (item.start_date === item.end_date) {
    return item.start_date;
  }
  return `${item.start_date} 至 ${item.end_date}`;
}

function getLatestHistory(item: any) {
  const history = item.approval_history || [];
  return history.length > 0 ? history[history.length - 1] : null;
}

function getApproverName(node: any) {
  if (!node) return '-';
  return node.full_name || node.username || node.user_id || '-';
}

function getApproverLevel(chain: any[], userId: string) {
  if (!userId) return null;
  const index = (chain || []).findIndex((node) => node.user_id === userId);
  return index !== -1 ? index + 1 : null;
}

function getStatusDisplay(item: any) {
  const status = item.approval_status;
  if (status !== 'pending') {
    return leaveStatusLabelMap[status] || status;
  }
  const chain = item.approval_chain || [];
  const level = getApproverLevel(chain, item.current_approver_id);
  const currentNode = chain.find((node: any) => node.user_id === item.current_approver_id);
  if (!currentNode) return '待审批';
  const prefix = level ? `第${level}级：` : '';
  return `审批中（${prefix}${getApproverName(currentNode)}）`;
}

function getLatestActionDisplay(item: any) {
  const latest = getLatestHistory(item);
  if (!latest) return '尚未处理';
  const chain = item.approval_chain || [];
  const level = getApproverLevel(chain, latest.approver_id);
  const actor = latest.approver_name || '-';
  const atText = latest.at ? new Date(latest.at).toLocaleString('zh-CN') : '-';

  if (latest.action === 'approved' && item.approval_status === 'pending') {
    const levelText = level ? `第${level}级：` : '';
    return `流转中 / ${levelText}${actor} / ${atText}`;
  }
  if (latest.action === 'approved') return `${actor}已通过 / ${atText}`;
  if (latest.action === 'rejected') return `${actor}已驳回 / ${atText}`;
  if (latest.action === 'withdrawn') return `${actor}已撤回 / ${atText}`;
  return `${actor}待审批 / ${atText}`;
}

function getCurrentApproverLabel(item: any) {
  const chain = item.approval_chain || [];
  const currentNode = chain.find((node: any) => node.user_id === item.current_approver_id);
  if (!currentNode) return '-';
  const level = getApproverLevel(chain, item.current_approver_id);
  const prefix = level ? `第${level}级：` : '';
  return prefix + getApproverName(currentNode);
}

function getLeaveTypeColor(type: string, status: string) {
  const baseColor = leaveTypeColorMap[type] || '#94a3b8';
  if (status === 'approved') return baseColor;
  const hex = baseColor.replace('#', '');
  const red = Number.parseInt(hex.slice(0, 2), 16);
  const green = Number.parseInt(hex.slice(2, 4), 16);
  const blue = Number.parseInt(hex.slice(4, 6), 16);
  return `rgba(${red}, ${green}, ${blue}, 0.55)`;
}

function buildDayMap(items: any[], year: number) {
  const map: Record<string, any[]> = {};
  items.forEach((item) => {
    (item.date_keys || []).forEach((dateKey: string) => {
      if (!dateKey.startsWith(`${year}-`)) return;
      map[dateKey] = map[dateKey] || [];
      map[dateKey].push({ ...item });
    });
  });
  Object.values(map).forEach((entries) => {
    entries.sort((left: any, right: any) => left.start_date.localeCompare(right.start_date));
  });
  return map;
}

function getDisplayLimit(entryCount: number) {
  if (entryCount <= 2) return 2;
  if (entryCount <= 4) return 3;
  return 2;
}

function getSessionShortLabel(session: string) {
  if (session === 'morning') return '上';
  if (session === 'afternoon') return '下';
  return '';
}

function renderCalendarDetail(dateKey: string, entries: any[]) {
  if (!dateKey) {
    return { title: '日期详情', content: '点击年历中的某一天后，这里会展示当天的请假明细。', isEmpty: true };
  }
  if (entries.length === 0) {
    return { title: `${dateKey} · 日期详情`, content: '当天没有请假记录。', isEmpty: true };
  }
  return {
    title: `${dateKey} · 日期详情`,
    content: entries.map((item: any) => ({
      type: leaveTypeLabelMap[item.leave_type] || item.leave_type,
      session: leaveSessionLabelMap[item.session] || item.session,
      status: getStatusDisplay(item),
      reason: item.reason || '-',
      handover_to: item.handover_to || '-',
      review_comment: item.review_comment || '-',
    })),
    isEmpty: false,
  };
}

interface CalendarDetail {
  title: string;
  content: string | { handover_to: string; reason: string; review_comment: string; session: string; status: string; type: string; }[];
  isEmpty: boolean;
}

const calendarDetail = computed<CalendarDetail>(() => {
  const dayMap = buildDayMap(visibleLeaveItems.value, currentYear.value);
  const entries = selectedDateKey.value ? dayMap[selectedDateKey.value] || [] : [];
  return renderCalendarDetail(selectedDateKey.value, entries);
});

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

function generateCalendarMonth(year: number, monthIndex: number) {
  const firstDay = new Date(year, monthIndex, 1).getDay();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const dayMap = buildDayMap(visibleLeaveItems.value, year);

  const cells: {
    dateKey: string;
    day: number;
    entries: any[];
    hasLeave: boolean;
    isEmpty: boolean;
    isSelected: boolean;
    isWeekend: boolean;
  }[] = [];

  for (let i = 0; i < firstDay; i++) {
    cells.push({ day: 0, isEmpty: true, isWeekend: false, hasLeave: false, isSelected: false, dateKey: '', entries: [] });
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dateKey = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const entries = dayMap[dateKey] || [];
    const currentDate = new Date(year, monthIndex, day);
    const isWeekend = currentDate.getDay() === 0 || currentDate.getDay() === 6;
    const isSelected = selectedDateKey.value === dateKey;

    cells.push({
      day,
      isEmpty: false,
      isWeekend,
      hasLeave: entries.length > 0,
      isSelected,
      dateKey,
      entries,
    });
  }

  const rows = [];
  for (let i = 0; i < cells.length; i += 7) {
    rows.push(cells.slice(i, i + 7));
  }

  return { monthName: monthNames[monthIndex], rows };
}

const calendarMonths = computed(() => {
  return monthNames.map((_, index) => generateCalendarMonth(currentYear.value, index));
});

function applyStatusFilter(items: any[]) {
  if (!hideWithdrawnOrRejected.value) return items || [];
  return (items || []).filter(
    (item) => item.approval_status !== 'withdrawn' && item.approval_status !== 'rejected',
  );
}

function updateVisibleItems() {
  visibleLeaveItems.value = applyStatusFilter(allLeaveItems.value);
}

async function loadMyLeaveRequests() {
  loading.value = true;
  try {
    const items = await getMyLeaveRequestsApi();
    allLeaveItems.value = items;
    updateVisibleItems();
  } catch (error) {
    console.error('Load leave requests error:', error);
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

async function loadUserInfo() {
  try {
    const user = await getUserInfoApi();
    userInfo.value = {
      username: user.username,
      full_name: user.realName,
      department: user.department || null,
      is_admin: (user.roles || []).includes('admin'),
    };
  } catch {
    userInfo.value = null;
  }
}

async function handleCreate() {
  if (!createForm.start_date || !createForm.end_date) {
    showFormMessage('请完整选择请假日期', 'error');
    return;
  }
  if (createForm.start_date > createForm.end_date) {
    showFormMessage('开始日期不能大于结束日期', 'error');
    return;
  }

  clearFormMessage();
  try {
    await createLeaveRequestApi({
      leave_type: createForm.leave_type as any,
      start_date: createForm.start_date,
      end_date: createForm.end_date,
      session: createForm.session as any,
      reason: createForm.reason.trim() || null,
      handover_to: createForm.handover_to.trim() || null,
    });
    showFormMessage('请假申请已提交，数据已保存到 leave_requests。', 'success');
    createForm.leave_type = 'annual';
    createForm.start_date = '';
    createForm.end_date = '';
    createForm.session = 'full_day';
    createForm.handover_to = '';
    createForm.reason = '';
    await loadMyLeaveRequests();
    await loadAnnualLeaveSummary();
  } catch (error: any) {
    showFormMessage(error.message || '提交请假失败', 'error');
  }
}

async function handleWithdraw(id: string) {
  try {
    await ElMessageBox.confirm('确认撤回这条请假申请吗？撤回后将不再进入审批流程。', '确认撤回', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    });
  } catch {
    return;
  }

  try {
    await withdrawLeaveRequestApi(id, { withdraw_comment: null });
    ElMessage.success('请假申请已撤回');
    await loadMyLeaveRequests();
    await loadAnnualLeaveSummary();
  } catch {
    ElMessage.error('撤回失败');
  }
}

function toggleStatusFilter() {
  hideWithdrawnOrRejected.value = !hideWithdrawnOrRejected.value;
  selectedDateKey.value = '';
  updateVisibleItems();
}

function changeYear(delta: number) {
  currentYear.value += delta;
  selectedDateKey.value = '';
}

function goToCurrentYear() {
  currentYear.value = new Date().getFullYear();
  selectedDateKey.value = '';
}

function goBackHome() {
  router.push('/dashboard/workspace');
}

onMounted(() => {
  startLiveClock();
  loadUserInfo();
  loadMyLeaveRequests();
  loadAnnualLeaveSummary();
});

onUnmounted(() => {
  if (timer) clearInterval(timer);
});
</script>

<template>
  <div class="my-leave-page" v-loading="loading">
    <div class="page-header">
      <div class="header-info">
        <h2>我的请假</h2>
        <p class="page-subtitle">提交自己的请假申请，所有请假信息统一保存在 leave_requests 集合中。</p>
        <div class="live-time">{{ currentTime }}</div>
      </div>
      <div class="header-actions">
        <ElButton @click="goBackHome">返回工作台</ElButton>
      </div>
    </div>

    <div class="grid">
      <ElCard class="card">
        <template #header>
          <h3>新增请假</h3>
        </template>

        <div v-if="formMessage" class="message" :class="[formMessageType]">
          {{ formMessage }}
        </div>

        <ElForm :model="createForm" label-width="100px">
          <ElFormItem label="请假类型" required>
            <ElSelect v-model="createForm.leave_type">
              <ElOption v-for="opt in leaveTypeOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
            </ElSelect>
          </ElFormItem>

          <div class="row-2">
            <ElFormItem label="开始日期" required>
              <ElDatePicker v-model="createForm.start_date" type="date" value-format="YYYY-MM-DD" />
            </ElFormItem>
            <ElFormItem label="结束日期" required>
              <ElDatePicker v-model="createForm.end_date" type="date" value-format="YYYY-MM-DD" />
            </ElFormItem>
          </div>

          <ElFormItem label="请假时段" required>
            <ElSelect v-model="createForm.session">
              <ElOption v-for="opt in sessionOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
            </ElSelect>
          </ElFormItem>

          <ElFormItem label="工作交接人">
            <ElInput v-model="createForm.handover_to" placeholder="选填" />
          </ElFormItem>

          <ElFormItem label="请假说明">
            <ElInput v-model="createForm.reason" type="textarea" :rows="3" placeholder="请填写请假原因" />
          </ElFormItem>

          <ElButton type="primary" @click="handleCreate">提交请假申请</ElButton>
        </ElForm>

        <div class="hint">
          说明：半天请假仅支持单日申请；提交后会写入 leave_requests，审批状态默认是"待审批"。
        </div>
      </ElCard>

      <ElCard class="card">
        <template #header>
          <div class="list-header">
            <h3>我的请假记录</h3>
            <div class="list-actions">
              <ElButton @click="loadMyLeaveRequests">刷新列表</ElButton>
              <ElButton @click="toggleStatusFilter">
                {{ hideWithdrawnOrRejected ? '显示全部' : '隐藏撤回/驳回' }}
              </ElButton>
            </div>
          </div>
        </template>

        <div v-if="visibleLeaveItems.length === 0" class="empty">
          你还没有请假记录，可以先在左侧提交自己的请假申请。
        </div>

        <div v-else class="leave-list">
          <div v-for="item in visibleLeaveItems" :key="item.id" class="leave-item">
            <div class="leave-item-top">
              <div class="leave-title">{{ formatDateRange(item) }}</div>
              <ElTag :type="item.approval_status === 'pending' ? 'warning' : item.approval_status === 'approved' ? 'success' : item.approval_status === 'rejected' ? 'danger' : 'info'">
                {{ getStatusDisplay(item) }}
              </ElTag>
            </div>
            <div class="badges">
              <ElTag :style="{ background: `rgba(96, 165, 250, 0.2)`, color: '#1d4ed8' }">
                {{ leaveTypeLabelMap[item.leave_type] }}
              </ElTag>
              <ElTag :style="{ background: `rgba(96, 165, 250, 0.2)`, color: '#1d4ed8' }">
                {{ leaveSessionLabelMap[item.session] }}
              </ElTag>
            </div>
            <div class="leave-meta">
              <div>请假天数覆盖：{{ (item.date_keys || []).length }} 天</div>
              <div>创建时间：{{ item.created_at ? new Date(item.created_at).toLocaleString('zh-CN') : '-' }}</div>
            </div>
            <div class="leave-extra">
              <div>请假说明：{{ item.reason || '-' }}</div>
              <div>工作交接人：{{ item.handover_to || '-' }}</div>
              <div>当前审批人：{{ getCurrentApproverLabel(item) }}</div>
              <div>最近处理：{{ getLatestActionDisplay(item) }}</div>
              <div>处理备注：{{ (getLatestHistory(item) && getLatestHistory(item).comment) || '-' }}</div>
            </div>
            <div v-if="item.approval_status === 'pending'" class="leave-actions">
              <ElButton type="danger" @click="handleWithdraw(item.id)">撤回申请</ElButton>
            </div>
          </div>
        </div>
      </ElCard>
    </div>

    <ElCard class="card calendar-card">
      <template #header>
        <div class="calendar-toolbar">
          <div>
            <h3>我的请假年历</h3>
            <p class="page-subtitle">按年查看自己的请假分布，直接看到每一天的请假类型和状态。</p>
          </div>
          <div class="calendar-actions">
            <ElButton @click="changeYear(-1)">上一年</ElButton>
            <span class="year-badge">{{ currentYear }}</span>
            <ElButton @click="changeYear(1)">下一年</ElButton>
            <ElButton type="primary" @click="goToCurrentYear">回到今年</ElButton>
          </div>
        </div>
      </template>

      <div class="calendar-summary">
        <div class="summary-block">
          <div class="summary-block-label">当年请假记录</div>
          <div class="summary-block-value">{{ yearRecordCount }}</div>
        </div>
        <div class="summary-block">
          <div class="summary-block-label">当年覆盖天数</div>
          <div class="summary-block-value">{{ yearDayCount }}</div>
        </div>
        <div class="summary-block">
          <div class="summary-block-label">待审批记录</div>
          <div class="summary-block-value">{{ yearPendingCount }}</div>
        </div>
        <div class="summary-block">
          <div class="summary-block-label">当年年假总计</div>
          <div class="summary-block-value">{{ annualLeaveSummary?.entitlement_days || '-' }}</div>
        </div>
        <div class="summary-block">
          <div class="summary-block-label">当年年假可用</div>
          <div class="summary-block-value">{{ annualLeaveSummary?.available_days || '-' }}</div>
        </div>
      </div>

      <div class="year-calendar-grid">
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
                    class="calendar-day" :class="[{ weekend: cell.isWeekend, 'has-leave': cell.hasLeave, selected: cell.isSelected }]"
                    @click="selectedDateKey = cell.dateKey"
                  >
                    <div class="calendar-day-top">
                      <span class="day-number">{{ cell.day }}</span>
                      <span v-if="cell.entries.length" class="day-badge">{{ cell.entries.length }}</span>
                    </div>
                    <div class="calendar-leave-list">
                      <div
                        v-for="(entry, entryIndex) in cell.entries.slice(0, getDisplayLimit(cell.entries.length))"
                        :key="entryIndex"
                        class="calendar-leave-item" :class="[{ dimmed: entry.approval_status === 'pending' }]"
                      >
                        <span class="type-dot" :style="{ background: getLeaveTypeColor(entry.leave_type, entry.approval_status) }"></span>
                        <span class="calendar-leave-name">{{ leaveTypeLabelMap[entry.leave_type] }}</span>
                        <span v-if="getSessionShortLabel(entry.session)" class="calendar-leave-session">
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

      <div class="calendar-detail">
        <h4>{{ calendarDetail.title }}</h4>
        <div v-if="calendarDetail.isEmpty" class="empty">{{ calendarDetail.content }}</div>
        <div v-else>
          <div v-for="(item, index) in (calendarDetail.content as any)" :key="index" class="calendar-detail-item">
            <div>类型：{{ item.type }}</div>
            <div>时段：{{ item.session }}</div>
            <div>状态：{{ item.status }}</div>
            <div>说明：{{ item.reason }}</div>
            <div>交接人：{{ item.handover_to }}</div>
            <div>审批备注：{{ item.review_comment }}</div>
          </div>
        </div>
      </div>
    </ElCard>
  </div>
</template>

<style scoped>
.my-leave-page {
  padding: 32px;
  background: #f8fafc;
  min-height: calc(100vh - 80px);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 24px;
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
  gap: 12px;
}

.grid {
  display: grid;
  grid-template-columns: minmax(320px, 420px) minmax(0, 1fr);
  gap: 18px;
  margin-bottom: 18px;
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

.row-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.message {
  margin-bottom: 14px;
  padding: 12px 14px;
  border-radius: 12px;
  font-size: 14px;
}

.message.success {
  background: #dcfce7;
  color: #166534;
}

.message.error {
  background: #fee2e2;
  color: #991b1b;
}

.hint {
  margin-top: 12px;
  color: #64748b;
  font-size: 13px;
  line-height: 1.7;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.list-actions {
  display: flex;
  gap: 10px;
}

.empty {
  padding: 20px;
  border-radius: 14px;
  background: #f8fafc;
  color: #64748b;
  line-height: 1.7;
}

.leave-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.leave-item {
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 16px;
  background: #f8fafc;
}

.leave-item-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
}

.leave-title {
  font-size: 16px;
  font-weight: 700;
}

.badges {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 10px;
}

.leave-meta {
  color: #475569;
  font-size: 14px;
  line-height: 1.8;
}

.leave-extra {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid #e2e8f0;
  color: #334155;
  font-size: 14px;
  line-height: 1.7;
}

.leave-actions {
  margin-top: 12px;
  display: flex;
  justify-content: flex-end;
}

.calendar-card {
  margin-top: 18px;
}

.calendar-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.calendar-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
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

.calendar-summary {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.summary-block {
  padding: 14px 16px;
  border-radius: 14px;
  background: #f8fafc;
}

.summary-block-label {
  color: #64748b;
  font-size: 13px;
}

.summary-block-value {
  margin-top: 8px;
  font-size: 22px;
  font-weight: 700;
}

.year-calendar-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 20px 16px;
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
  height: 28px;
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
  min-height: 74px;
  padding: 6px;
  position: relative;
  background: #fff;
  cursor: pointer;
}

.calendar-day.weekend {
  background: #f1f5f9;
}

.calendar-day.selected {
  box-shadow: inset 0 0 0 2px #2563eb;
  background: #eff6ff;
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
  min-width: 30px;
  padding: 2px 6px;
  border-radius: 999px;
  background: #dbeafe;
  color: #1d4ed8;
  font-size: 11px;
  font-weight: 700;
}

.calendar-leave-list {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.calendar-leave-item {
  display: flex;
  align-items: center;
  gap: 5px;
  min-width: 0;
  font-size: 11px;
  line-height: 1.25;
}

.calendar-leave-item.dimmed {
  opacity: 0.72;
}

.type-dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  flex: 0 0 auto;
}

.calendar-leave-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.calendar-leave-session {
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

.calendar-detail {
  margin-top: 16px;
  padding: 16px;
  border-radius: 14px;
  background: #f8fafc;
}

.calendar-detail h4 {
  margin: 0 0 12px;
  font-size: 16px;
}

.calendar-detail-item {
  padding: 10px 0;
  border-top: 1px solid #e2e8f0;
  font-size: 14px;
  line-height: 1.7;
}

.calendar-detail-item:first-child {
  border-top: 0;
  padding-top: 0;
}

@media (max-width: 1100px) {
  .grid {
    grid-template-columns: 1fr;
  }
  .year-calendar-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 900px) {
  .page-header {
    flex-direction: column;
  }
  .calendar-summary,
  .year-calendar-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .row-2 {
    grid-template-columns: 1fr;
  }
  .calendar-summary,
  .year-calendar-grid {
    grid-template-columns: 1fr;
  }
}
</style>
