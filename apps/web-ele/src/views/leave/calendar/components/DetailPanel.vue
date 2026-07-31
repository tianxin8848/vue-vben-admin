<script lang="ts" setup>
import { computed, ref } from 'vue';

import {
  ElButton,
  ElCard,
  ElDivider,
  ElMessage,
  ElOption,
  ElSelect,
  ElTag,
} from 'element-plus';

import { $t } from '#/locales';

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
  content:
    | string
    | { grouped: Record<string, CalendarRecord[]>; holiday: Holiday | null };
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
  (e: 'removeHoliday' | 'setHoliday'): void;
}>();

const leaveTypeConfig: Record<string, { color: string; labelKey: string }> = {
  annual: { labelKey: 'page.leave.leaveTypes.annual', color: '#60a5fa' },
  personal: { labelKey: 'page.leave.leaveTypes.personal', color: '#fb923c' },
  sick: { labelKey: 'page.leave.leaveTypes.sick', color: '#f87171' },
  lieu: { labelKey: 'page.leave.leaveTypes.lieu', color: '#4ade80' },
  long: { labelKey: 'page.leave.leaveTypes.long', color: '#a78bfa' },
};

const approvalStatusConfig: Record<
  string,
  { labelKey: string; type: 'danger' | 'info' | 'success' | 'warning' }
> = {
  approved: { labelKey: 'page.leave.approvalStatus.approved', type: 'success' },
  pending: { labelKey: 'page.leave.approvalStatus.pending', type: 'warning' },
  rejected: { labelKey: 'page.leave.approvalStatus.rejected', type: 'danger' },
  withdrawn: { labelKey: 'page.leave.approvalStatus.withdrawn', type: 'info' },
};

const holidayNameOptions = [
  { key: 'newYear' },
  { key: 'springFestival' },
  { key: 'qingming' },
  { key: 'laborDay' },
  { key: 'dragonBoat' },
  { key: 'midAutumn' },
  { key: 'nationalDay' },
  { key: 'christmas' },
  { key: 'publicHoliday' },
  { key: 'companyHoliday' },
  { key: 'makeupDay' },
  { key: 'other' },
];

const selectedHolidayKey = ref(holidayNameOptions[0]?.key ?? 'newYear');

function getHolidayLabel(key: string) {
  return $t(`page.leave.calendarView.holidayNames.${key}`) as string;
}

const selectedHolidayLabel = computed(() =>
  getHolidayLabel(selectedHolidayKey.value),
);

function getHolidayForDate(dateKey: string, region: string) {
  if (!region || !dateKey) return null;
  return props.regionalHolidays.find(
    (h) => h.region === region && h.date === dateKey,
  );
}

function getActiveRegionKey() {
  if (!props.region || props.region === '' || props.region === 'all') return '';
  if (props.region === '__unset__') return '';
  return props.region;
}

function getLeaveTypeColor(type: string) {
  return leaveTypeConfig[type]?.color || '#94a3b8';
}

function getLeaveTypeLabel(type: string) {
  return leaveTypeConfig[type]
    ? ($t(leaveTypeConfig[type].labelKey) as string)
    : type;
}

function getApprovalStatusType(
  status: string,
): 'danger' | 'info' | 'success' | 'warning' {
  return approvalStatusConfig[status]?.type ?? 'info';
}

function getApprovalStatusLabel(status: string) {
  return approvalStatusConfig[status]
    ? ($t(approvalStatusConfig[status].labelKey) as string)
    : status;
}

const sessionLabelKeys: Record<string, string> = {
  full_day: 'page.leave.session.full_day',
  morning: 'page.leave.session.morning',
  afternoon: 'page.leave.session.afternoon',
};

function getSessionLabel(session: string) {
  const key = sessionLabelKeys[session] || 'page.leave.session.full_day';
  return $t(key) as string;
}

const calendarDetail = computed<CalendarDetail>(() => {
  if (!props.selectedDateKey) {
    return {
      title: $t('page.leave.calendarView.detail.dateDetail') as string,
      content: $t('page.leave.calendarView.detail.emptyHint') as string,
      isEmpty: true,
    };
  }

  const entries = props.dayMap[props.selectedDateKey] || [];
  const activeRegion =
    props.region && props.region !== 'all' ? props.region : '';
  const holiday = activeRegion
    ? (props.regionalHolidays.find(
        (h) => h.region === activeRegion && h.date === props.selectedDateKey,
      ) ?? null)
    : null;

  if (entries.length === 0 && !holiday) {
    return {
      title: `${props.selectedDateKey} · ${$t('page.leave.calendarView.detail.dateDetail')}`,
      content: $t('page.leave.calendarView.detail.noRecordsForDay') as string,
      isEmpty: true,
    };
  }

  const grouped: Record<string, CalendarRecord[]> = {};
  entries.forEach((entry) => {
    const leaveType = entry.leave_type;
    if (!leaveType) return;
    grouped[leaveType] = grouped[leaveType] || [];
    grouped[leaveType].push(entry);
  });

  return {
    title: `${props.selectedDateKey} · ${$t('page.leave.calendarView.detail.leaveDetail')}`,
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
  const holidayLabel = selectedHolidayLabel.value;
  if (!activeRegion || !dateKey || !holidayLabel) {
    ElMessage.warning(
      $t('page.leave.calendarView.detail.selectRegionAndDateFirst') as string,
    );
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
    <div style="margin-bottom: 24px">
      <h3 style="margin: 0 0 12px; font-size: 16px; font-weight: 600">
        {{ calendarDetail.title }}
      </h3>
      <div
        v-if="calendarDetail.isEmpty"
        style="
          padding: 16px;
          font-size: 13px;
          color: #64748b;
          background: #f8fafc;
          border-radius: 8px;
        "
      >
        {{ calendarDetail.content }}
      </div>
      <div v-else>
        <div
          v-if="(calendarDetail.content as any).holiday"
          style="margin-bottom: 16px"
        >
          <ElTag type="danger" size="large" style="margin-bottom: 8px">
            {{ $t('page.leave.calendarView.detail.regionalHolidayPrefix')
            }}{{ (calendarDetail.content as any).holiday.holiday_name }}
          </ElTag>
          <div style="font-size: 13px; color: #64748b">
            {{ (calendarDetail.content as any).holiday.region }} ·
            {{ (calendarDetail.content as any).holiday.date }}
          </div>
        </div>
        <div
          v-for="(entries, type) in (calendarDetail.content as any).grouped"
          :key="String(type)"
          style="margin-bottom: 16px"
        >
          <div
            style="
              display: flex;
              align-items: center;
              justify-content: space-between;
              margin-bottom: 8px;
            "
          >
            <ElTag
              :style="{
                background: `${getLeaveTypeColor(String(type))}20`,
                color: getLeaveTypeColor(String(type)),
              }"
              size="large"
            >
              {{ getLeaveTypeLabel(String(type)) }}
            </ElTag>
            <span style="font-size: 13px; color: #64748b">{{ entries.length }}
              {{ $t('page.leave.calendarView.stats.personUnit') }}</span>
          </div>
          <div style="display: flex; flex-direction: column; gap: 8px">
            <div
              v-for="entry in entries"
              :key="entry.id"
              style="
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 8px 12px;
                background: #f8fafc;
                border-radius: 8px;
              "
            >
              <span style="font-size: 14px; color: #0f172a">{{ entry.employee_name }} ·
                {{
                  entry.employee_department ||
                  $t('page.leave.calendarView.ungrouped')
                }}</span>
              <div
                style="
                  display: flex;
                  gap: 8px;
                  align-items: center;
                  font-size: 13px;
                "
              >
                <span style="color: #64748b">{{
                  getSessionLabel(entry.session)
                }}</span>
                <ElTag
                  :type="getApprovalStatusType(entry.approval_status)"
                  size="small"
                >
                  {{ getApprovalStatusLabel(entry.approval_status) }}
                </ElTag>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <ElDivider />

    <div style="margin-bottom: 24px">
      <h3 style="margin: 0 0 12px; font-size: 16px; font-weight: 600">
        {{ $t('page.leave.calendarView.detail.holidayMaintenance') }}
      </h3>
      <div
        v-if="!selectedDateKey || !getActiveRegionKey()"
        style="
          padding: 16px;
          font-size: 13px;
          color: #64748b;
          background: #f8fafc;
          border-radius: 8px;
        "
      >
        {{ $t('page.leave.calendarView.detail.selectRegionFirst') }}
      </div>
      <div v-else>
        <div style="margin-bottom: 8px; font-size: 14px; font-weight: 600">
          {{ getActiveRegionKey() }} · {{ selectedDateKey }}
        </div>
        <div style="margin-bottom: 12px; font-size: 13px; color: #64748b">
          <template
            v-if="getHolidayForDate(selectedDateKey, getActiveRegionKey())"
          >
            {{ $t('page.leave.calendarView.detail.currentHolidaySet')
            }}<ElTag type="success">
              {{
                getHolidayForDate(selectedDateKey, getActiveRegionKey())
                  ?.holiday_name
              }}
            </ElTag>
          </template>
          <template v-else>
            {{ $t('page.leave.calendarView.detail.noHolidaySet') }}
          </template>
        </div>
        <div style="display: flex; flex-wrap: wrap; gap: 10px">
          <ElSelect v-model="selectedHolidayKey" style="width: 160px">
            <ElOption
              v-for="opt in holidayNameOptions"
              :key="opt.key"
              :label="getHolidayLabel(opt.key)"
              :value="opt.key"
            />
          </ElSelect>
          <ElButton type="primary" @click="setHoliday">
            {{ $t('page.leave.calendarView.detail.setHoliday') }}
          </ElButton>
          <ElButton
            @click="removeHoliday"
            :disabled="
              !getHolidayForDate(selectedDateKey, getActiveRegionKey())
            "
          >
            {{ $t('page.leave.calendarView.detail.unsetHoliday') }}
          </ElButton>
        </div>
      </div>
    </div>

    <ElDivider />

    <div>
      <h3 style="margin: 0 0 12px; font-size: 16px; font-weight: 600">
        {{ $t('page.leave.calendarView.detail.usageInstructions') }}
      </h3>
      <div style="display: flex; flex-direction: column; gap: 12px">
        <div style="font-size: 13px; line-height: 1.6; color: #475569">
          <strong style="color: #0f172a">{{
            $t('page.leave.calendarView.detail.instructionOverviewTitle')
          }}</strong>
          {{ $t('page.leave.calendarView.detail.instructionOverviewBody') }}
        </div>
        <div style="font-size: 13px; line-height: 1.6; color: #475569">
          <strong style="color: #0f172a">{{
            $t('page.leave.calendarView.detail.instructionRiskTitle')
          }}</strong>
          {{ $t('page.leave.calendarView.detail.instructionRiskBody') }}
        </div>
        <div style="font-size: 13px; line-height: 1.6; color: #475569">
          <strong style="color: #0f172a">{{
            $t('page.leave.calendarView.detail.instructionFilterTitle')
          }}</strong>
          {{ $t('page.leave.calendarView.detail.instructionFilterBody') }}
        </div>
        <div style="font-size: 13px; line-height: 1.6; color: #475569">
          <strong style="color: #0f172a">{{
            $t('page.leave.calendarView.detail.instructionFutureTitle')
          }}</strong>
          {{ $t('page.leave.calendarView.detail.instructionFutureBody') }}
        </div>
      </div>
    </div>
  </ElCard>
</template>
