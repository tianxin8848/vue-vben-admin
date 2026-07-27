<script lang="ts" setup>
import { computed, ref } from 'vue';
import { ElButton, ElCard, ElDivider, ElMessage, ElOption, ElSelect, ElTag } from 'element-plus';

interface CalendarRecord {
  id: string;
  employee_name: string;
  employee_department: string;
  leave_type: string;
  approval_status: string;
  session: string;
}

interface Holiday {
  region: string;
  date: string;
  holiday_name: string;
}

interface CalendarDetail {
  title: string;
  content: string | { grouped: Record<string, CalendarRecord[]>; holiday: Holiday | null; };
  isEmpty: boolean;
}

interface Props {
  dayMap: Record<string, CalendarRecord[]>;
  selectedDateKey: string;
  region: string;
  regionalHolidays: Holiday[];
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'setHoliday' | 'removeHoliday'): void;
}>();

const leaveTypeConfig: Record<string, { color: string; label: string; }> = {
  annual: { label: '年假', color: '#60a5fa' },
  personal: { label: '事假', color: '#fb923c' },
  sick: { label: '病假', color: '#f87171' },
  lieu: { label: '调休', color: '#4ade80' },
  long: { label: '长假', color: '#a78bfa' },
};

const approvalStatusConfig: Record<string, { label: string; type: 'success' | 'warning' | 'danger' | 'info' }> = {
  approved: { label: '已通过', type: 'success' },
  pending: { label: '待审批', type: 'warning' },
  rejected: { label: '已驳回', type: 'danger' },
  withdrawn: { label: '已撤回', type: 'info' },
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
  return props.regionalHolidays.find((h) => h.region === region && h.date === dateKey);
}

function getActiveRegionKey() {
  if (!props.region || props.region === '' || props.region === 'all') return '';
  if (props.region === '__unset__') return '';
  return props.region;
}

function getLeaveTypeColor(type: string) {
  return leaveTypeConfig[type]?.color || '#94a3b8';
}

function getApprovalStatusType(status: string): 'success' | 'warning' | 'danger' | 'info' {
  return approvalStatusConfig[status]?.type ?? 'info';
}

const calendarDetail = computed<CalendarDetail>(() => {
  if (!props.selectedDateKey) {
    return { title: '日期详情', content: '点击任意日期格子后，这里会显示当天请假人员清单、假期类型、时段和审批状态。', isEmpty: true };
  }

  const entries = props.dayMap[props.selectedDateKey] || [];
  const activeRegion = props.region && props.region !== 'all' ? props.region : '';
  const holiday = activeRegion ? (props.regionalHolidays.find((h) => h.region === activeRegion && h.date === props.selectedDateKey) ?? null) : null;

  if (entries.length === 0 && !holiday) {
    return { title: `${props.selectedDateKey} · 日期详情`, content: '当天暂无请假记录，可作为正常出勤日期。', isEmpty: true };
  }

  const grouped: Record<string, CalendarRecord[]> = {};
  entries.forEach((entry) => {
    const leaveType = entry.leave_type;
    if (!leaveType) return;
    grouped[leaveType] = grouped[leaveType] || [];
    grouped[leaveType].push(entry);
  });

  return {
    title: `${props.selectedDateKey} · 请假详情`,
    content: {
      holiday,
      grouped,
    },
    isEmpty: false,
  };
});

async function setHoliday() {
  const activeRegion = getActiveRegionKey();
  const dateKey = props.selectedDateKey;
  const holidayName = selectedHolidayName.value;
  if (!activeRegion || !dateKey || !holidayName) {
    ElMessage.warning('请先选择地区和日期');
    return;
  }
  emit('setHoliday');
}

function removeHoliday() {
  emit('removeHoliday');
}
</script>

<template>
  <ElCard>
    <div style="margin-bottom: 24px;">
      <h3 style="margin: 0 0 12px; font-size: 16px; font-weight: 600;">{{ calendarDetail.title }}</h3>
      <div v-if="calendarDetail.isEmpty" style="padding: 16px; background: #f8fafc; border-radius: 8px; color: #64748b; font-size: 13px;">
        {{ calendarDetail.content }}
      </div>
      <div v-else>
        <div v-if="(calendarDetail.content as any).holiday" style="margin-bottom: 16px;">
          <ElTag type="danger" size="large" style="margin-bottom: 8px;">地区假期：{{ (calendarDetail.content as any).holiday.holiday_name }}</ElTag>
          <div style="font-size: 13px; color: #64748b;">{{ (calendarDetail.content as any).holiday.region }} · {{ (calendarDetail.content as any).holiday.date }}</div>
        </div>
        <div v-for="(entries, type) in (calendarDetail.content as any).grouped" :key="String(type)" style="margin-bottom: 16px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <ElTag :style="{ background: `${getLeaveTypeColor(String(type))}20`, color: getLeaveTypeColor(String(type)) }" size="large">
              {{ leaveTypeConfig[String(type)]?.label || type }}
            </ElTag>
            <span style="font-size: 13px; color: #64748b;">{{ entries.length }} 人</span>
          </div>
          <div style="display: flex; flex-direction: column; gap: 8px;">
            <div v-for="entry in entries" :key="entry.id" style="display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; border-radius: 8px; background: #f8fafc;">
              <span style="font-size: 14px; color: #0f172a;">{{ entry.employee_name }} · {{ entry.employee_department || '未分组' }}</span>
              <div style="display: flex; align-items: center; gap: 8px; font-size: 13px;">
                <span style="color: #64748b;">{{ sessionLabelMap[entry.session] || '全天' }}</span>
                <ElTag :type="getApprovalStatusType(entry.approval_status)" size="small">
                  {{ approvalStatusConfig[entry.approval_status]?.label || entry.approval_status }}
                </ElTag>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <ElDivider />

    <div style="margin-bottom: 24px;">
      <h3 style="margin: 0 0 12px; font-size: 16px; font-weight: 600;">地区假期维护</h3>
      <div v-if="!selectedDateKey || !getActiveRegionKey()" style="padding: 16px; background: #f8fafc; border-radius: 8px; color: #64748b; font-size: 13px;">
        请先在上方选择具体地区，再点击某一天设置该地区的假期。
      </div>
      <div v-else>
        <div style="font-size: 14px; font-weight: 600; margin-bottom: 8px;">{{ getActiveRegionKey() }} · {{ selectedDateKey }}</div>
        <div style="font-size: 13px; color: #64748b; margin-bottom: 12px;">
          <template v-if="getHolidayForDate(selectedDateKey, getActiveRegionKey())">
            当前已设置假期：<ElTag type="success">{{ getHolidayForDate(selectedDateKey, getActiveRegionKey())?.holiday_name }}</ElTag>
          </template>
          <template v-else>
            当前未设置地区假期。
          </template>
        </div>
        <div style="display: flex; gap: 10px; flex-wrap: wrap;">
          <ElSelect v-model="selectedHolidayName" style="width: 160px">
            <ElOption v-for="name in holidayNameOptions" :key="name" :label="name" :value="name" />
          </ElSelect>
          <ElButton type="primary" @click="setHoliday">设置假期</ElButton>
          <ElButton @click="removeHoliday" :disabled="!getHolidayForDate(selectedDateKey, getActiveRegionKey())">
            取消设置
          </ElButton>
        </div>
      </div>
    </div>

    <ElDivider />

    <div>
      <h3 style="margin: 0 0 12px; font-size: 16px; font-weight: 600;">使用说明</h3>
      <div style="display: flex; flex-direction: column; gap: 12px;">
        <div style="font-size: 13px; color: #475569; line-height: 1.6;">
          <strong style="color: #0f172a;">总览阅读</strong>
          每天格子直接显示请假姓名，前置色点表示假期类型，右上角徽标显示当天总请假人数。
        </div>
        <div style="font-size: 13px; color: #475569; line-height: 1.6;">
          <strong style="color: #0f172a;">预警规则</strong>
          单日请假人数达到阈值后，会对日期格子加红框，帮助你快速识别人力紧张日期。
        </div>
        <div style="font-size: 13px; color: #475569; line-height: 1.6;">
          <strong style="color: #0f172a;">筛选方式</strong>
          支持按团队看全年排期，也支持搜索某个员工，直接高亮他全年所有请假日期。
        </div>
        <div style="font-size: 13px; color: #475569; line-height: 1.6;">
          <strong style="color: #0f172a;">后续接入</strong>
          当前已经接入真实请假日历接口，后续可以继续补录入、审批和点击日期快速操作能力。
        </div>
      </div>
    </div>
  </ElCard>
</template>
