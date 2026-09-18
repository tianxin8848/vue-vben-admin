<script lang="ts" setup>
import type { CalendarEmployee } from '../composables/useCalendarData';

import type { LeaveRequestApi } from '#/api';

import { computed, ref, watch } from 'vue';

import {
  ElButton,
  ElCard,
  ElDatePicker,
  ElInput,
  ElOption,
  ElSelect,
} from 'element-plus';

import {
  addLieuLeaveGrantApi,
  getLieuLeaveSummaryApi,
  listLieuLeaveGrantsApi,
} from '#/api';
import { $t } from '#/locales';
import { handleActionError, toastSuccess, toastWarning } from '#/utils/message';

const props = defineProps<{
  /** 员工目录，供下拉选择调休额度归属人 */
  employees: CalendarEmployee[];
}>();

/**
 * 额度查看年份固定为当前年，与后端年历页「调休额度」区块一致
 * （后端 `leave_calendar.html` 的 `currentYear` 初始化后不再随年历翻页变化）。
 */
const year = new Date().getFullYear();

const employeeId = ref('');
const summary = ref<LeaveRequestApi.LieuLeaveSummary | null>(null);
const grants = ref<LeaveRequestApi.LieuLeaveGrantResponse[]>([]);
/** 加班日（调休来源日），格式 YYYY-MM-DD；后端必填 */
const workDate = ref(formatToday());
/** 增加天数，跟随下拉；「增加半天」按钮无视该值固定发 0.5 */
const days = ref(1);
const remarks = ref('');
const loading = ref(false);

/** 返回今天 YYYY-MM-DD（本地时区），作为加班日默认值 */
function formatToday(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** 天数下拉选项，与后端页面一致：半天 / 1 天 / 1.5 天 / 2 天 */
const dayOptions = computed(() => [
  { label: $t('page.leave.calendarView.lieuAdmin.daysHalf'), value: 0.5 },
  { label: $t('page.leave.calendarView.lieuAdmin.daysOne'), value: 1 },
  { label: $t('page.leave.calendarView.lieuAdmin.daysOneHalf'), value: 1.5 },
  { label: $t('page.leave.calendarView.lieuAdmin.daysTwo'), value: 2 },
]);

/** 当前选中员工，用于状态行拼接姓名 */
const selectedEmployee = computed(() =>
  props.employees.find((emp) => String(emp.id) === employeeId.value),
);

/** 状态行文案：未选员工 → 提示语；未触顶 → 不限额；触顶 → 额度/已用/可用 + 最早到期 */
const statusText = computed(() => {
  const result = summary.value;
  if (!employeeId.value || !result) {
    return $t('page.leave.calendarView.lieuAdmin.statusHint');
  }
  const employee = selectedEmployee.value;
  const name =
    employee?.name ||
    employee?.username ||
    $t('page.leave.calendarView.lieuAdmin.fallbackEmployee');
  if (!result.lieu_capped) {
    return $t('page.leave.calendarView.lieuAdmin.statusUnlimited', {
      name,
      year,
      used: result.lieu_used_days ?? 0,
    });
  }
  const base = {
    name,
    year,
    granted: result.lieu_granted_days,
    used: result.lieu_used_days,
    available: result.lieu_available_days,
  };
  if (result.lieu_expires_on) {
    return $t('page.leave.calendarView.lieuAdmin.statusCappedExpires', {
      ...base,
      date: result.lieu_expires_on,
    });
  }
  return $t('page.leave.calendarView.lieuAdmin.statusCapped', base);
});

/** 所选加班日跨年提示；跨年时上方额度/明细并不覆盖该笔 */
const workDateYear = computed(() =>
  /^\d{4}-\d{2}-\d{2}$/.test(workDate.value)
    ? Number(workDate.value.slice(0, 4))
    : year,
);

function warnSelectEmployee() {
  toastWarning($t('page.leave.calendarView.lieuAdmin.selectEmployee'));
}

/** 拉取额度汇总 + 发放明细（切换员工时自动调用，与后端页面 change 行为一致） */
async function loadSummary() {
  if (!employeeId.value) return;
  loading.value = true;
  try {
    const data = await getLieuLeaveSummaryApi(employeeId.value, year);
    summary.value = data;
    await refreshGrants();
  } catch (error) {
    summary.value = null;
    grants.value = [];
    handleActionError(
      'leave/leave-calendar/LieuAdminPanel',
      error,
      $t('page.leave.calendarView.lieuAdmin.queryFailed'),
    );
  } finally {
    loading.value = false;
  }
}

/** 拉取当前员工、年份的调休发放明细列表 */
async function refreshGrants() {
  if (!employeeId.value) return;
  try {
    const rows = await listLieuLeaveGrantsApi(employeeId.value, year);
    grants.value = rows ?? [];
  } catch (error) {
    grants.value = [];
    handleActionError(
      'leave/leave-calendar/LieuAdminPanel',
      error,
      $t('page.leave.calendarView.lieuAdmin.grantsLoadFailed'),
    );
  }
}

watch(employeeId, (value) => {
  if (!value) {
    summary.value = null;
    grants.value = [];
    return;
  }
  loadSummary();
});

/** 增加调休额度；daysToAdd 为本次实际发放天数 */
async function grant(daysToAdd: number) {
  if (!employeeId.value) {
    warnSelectEmployee();
    return;
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(workDate.value)) {
    toastWarning($t('page.leave.calendarView.lieuAdmin.workDateRequired'));
    return;
  }
  if (!Number.isFinite(daysToAdd) || daysToAdd <= 0) {
    toastWarning($t('page.leave.calendarView.lieuAdmin.daysPositive'));
    return;
  }
  loading.value = true;
  try {
    const trimmed = remarks.value.trim();
    const params: LeaveRequestApi.AddLieuLeaveGrantParams = {
      employee_id: employeeId.value,
      work_date: workDate.value,
      days: daysToAdd,
      year,
    };
    if (trimmed) params.remarks = trimmed;
    const data = await addLieuLeaveGrantApi(params);
    summary.value = data;
    remarks.value = '';
    await refreshGrants();
    toastSuccess(
      $t('page.leave.calendarView.lieuAdmin.grantSuccess', { days: daysToAdd }),
    );
    // 后端按 work_date.year 落库，跨年时提醒该笔不会体现在当前年视图里
    if (workDateYear.value !== year) {
      toastWarning(
        $t('page.leave.calendarView.lieuAdmin.workDateYearMismatch', {
          workYear: workDateYear.value,
          currentYear: year,
        }),
      );
    }
  } catch (error) {
    handleActionError(
      'leave/leave-calendar/LieuAdminPanel',
      error,
      $t('page.leave.calendarView.lieuAdmin.grantFailed'),
    );
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <ElCard>
    <template #header>
      <span>{{ $t('page.leave.calendarView.lieuAdmin.title') }}</span>
    </template>

    <!-- 状态行：额度 / 已用 / 可用 / 最早到期；未发放过额度时显示不限额 -->
    <div class="lieu-admin__status">{{ statusText }}</div>

    <!-- 控制行：员工 / 加班日 / 天数 / 备注 / 增加 / 增加半天 -->
    <div class="lieu-admin__controls">
      <ElSelect
        v-model="employeeId"
        filterable
        :placeholder="$t('page.leave.calendarView.lieuAdmin.selectEmployee')"
        class="lieu-admin__employee"
      >
        <ElOption
          v-for="emp in props.employees"
          :key="emp.id"
          :label="`${emp.name}（${emp.username}）`"
          :value="String(emp.id)"
        />
      </ElSelect>

      <ElDatePicker
        v-model="workDate"
        type="date"
        value-format="YYYY-MM-DD"
        :placeholder="
          $t('page.leave.calendarView.lieuAdmin.workDatePlaceholder')
        "
        class="lieu-admin__work-date"
      />

      <ElSelect v-model="days" class="lieu-admin__days">
        <ElOption
          v-for="opt in dayOptions"
          :key="opt.value"
          :label="opt.label"
          :value="opt.value"
        />
      </ElSelect>

      <ElInput
        v-model="remarks"
        :maxlength="500"
        :placeholder="
          $t('page.leave.calendarView.lieuAdmin.remarksPlaceholder')
        "
        class="lieu-admin__remarks"
      />

      <ElButton type="primary" :loading="loading" @click="grant(days)">
        {{ $t('page.leave.calendarView.lieuAdmin.grant') }}
      </ElButton>
      <ElButton plain :loading="loading" @click="grant(0.5)">
        {{ $t('page.leave.calendarView.lieuAdmin.grantHalf') }}
      </ElButton>
    </div>

    <!-- 发放明细：行内文本列表（非表格） -->
    <div v-if="employeeId" class="lieu-admin__grants">
      <div class="lieu-admin__grants-title">
        {{ $t('page.leave.calendarView.lieuAdmin.grantsTitle') }}
      </div>
      <div v-if="grants.length === 0" class="lieu-admin__muted">
        {{ $t('page.leave.calendarView.lieuAdmin.grantsEmpty') }}
      </div>
      <div v-else class="lieu-admin__grants-list">
        <div v-for="row in grants" :key="row.id" class="lieu-admin__grant-line">
          <span class="lieu-admin__grant-days">+{{ row.days }}</span>
          <span>{{ row.work_date || '—' }}</span>
          <span v-if="row.expires_on" class="lieu-admin__muted">
            {{ $t('page.leave.calendarView.lieuAdmin.expiresPrefix')
            }}{{ row.expires_on }}
          </span>
          <span v-if="row.remarks" class="lieu-admin__muted">
            · {{ row.remarks }}
          </span>
        </div>
      </div>
    </div>
  </ElCard>
</template>

<style scoped>
.lieu-admin__status {
  font-size: 13px;
  line-height: 1.7;
  color: hsl(var(--muted-foreground));
}

.lieu-admin__controls {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
  margin-top: 12px;
}

.lieu-admin__employee {
  width: 240px;
}

.lieu-admin__work-date {
  width: 160px;
}

.lieu-admin__days {
  width: 120px;
}

.lieu-admin__remarks {
  width: 220px;
}

.lieu-admin__grants {
  margin-top: 16px;
}

.lieu-admin__grants-title {
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 600;
}

.lieu-admin__grants-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.lieu-admin__grant-line {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: baseline;
  font-size: 13px;
}

.lieu-admin__grant-days {
  font-weight: 700;
  color: hsl(var(--primary));
}

.lieu-admin__muted {
  font-size: 13px;
  color: hsl(var(--muted-foreground));
}
</style>
