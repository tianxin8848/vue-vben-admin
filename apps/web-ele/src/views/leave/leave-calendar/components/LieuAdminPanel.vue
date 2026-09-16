<script lang="ts" setup>
import type { CalendarEmployee } from '../composables/useCalendarData';

import type { LeaveRequestApi } from '#/api';

import { computed, ref } from 'vue';

import {
  ElButton,
  ElCard,
  ElDatePicker,
  ElInput,
  ElInputNumber,
  ElOption,
  ElSelect,
  ElTable,
  ElTableColumn,
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

const targetEmployeeId = ref('');
const queryYear = ref(new Date().getFullYear());
const queryResult = ref<LeaveRequestApi.LieuLeaveSummary | null>(null);
const grantDays = ref(1);
const grantRemarks = ref('');
/** 加班日（调休来源日），格式 YYYY-MM-DD；后端必填 */
const grantWorkDate = ref(formatToday());
const grants = ref<LeaveRequestApi.LieuLeaveGrantResponse[]>([]);
const loading = ref(false);

/** 返回今天 YYYY-MM-DD（本地时区），作为加班日默认值 */
function formatToday(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** 查询结果统计块：键 → 显示文案与取值 */
const statsTiles = computed(() => {
  const result = queryResult.value;
  if (!result) return [];
  return [
    {
      key: 'granted',
      label: $t('page.leave.calendarView.lieuAdmin.granted'),
      value: result.lieu_granted_days,
    },
    {
      key: 'used',
      label: $t('page.leave.calendarView.lieuAdmin.used'),
      value: result.lieu_used_days,
    },
    {
      key: 'available',
      label: $t('page.leave.calendarView.lieuAdmin.available'),
      value: result.lieu_available_days,
    },
    {
      key: 'capped',
      label: $t('page.leave.calendarView.lieuAdmin.capped'),
      value: result.lieu_capped ? '✓' : '—',
    },
  ];
});

function warnSelectEmployee() {
  toastWarning($t('page.leave.calendarView.lieuAdmin.selectEmployee'));
}

async function querySummary() {
  if (!targetEmployeeId.value) {
    warnSelectEmployee();
    return;
  }
  loading.value = true;
  try {
    console.warn(
      '[lieuAdmin] 調用 getLieuLeaveSummaryApi：employeeId=',
      targetEmployeeId.value,
      'year=',
      queryYear.value,
    );
    const data = await getLieuLeaveSummaryApi(
      targetEmployeeId.value,
      queryYear.value,
    );
    console.warn('[lieuAdmin] getLieuLeaveSummaryApi 返回：', data);
    queryResult.value = data;
    await refreshGrants();
  } catch (error) {
    queryResult.value = null;
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
  if (!targetEmployeeId.value) return;
  try {
    const rows = await listLieuLeaveGrantsApi(
      targetEmployeeId.value,
      queryYear.value,
    );
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

async function grant() {
  if (!targetEmployeeId.value) {
    warnSelectEmployee();
    return;
  }
  if (!grantWorkDate.value) {
    toastWarning($t('page.leave.calendarView.lieuAdmin.workDateRequired'));
    return;
  }
  if (!grantDays.value || grantDays.value <= 0) {
    toastWarning($t('page.leave.calendarView.lieuAdmin.daysPositive'));
    return;
  }
  loading.value = true;
  try {
    const remarks = grantRemarks.value.trim();
    const params: LeaveRequestApi.AddLieuLeaveGrantParams = {
      employee_id: targetEmployeeId.value,
      work_date: grantWorkDate.value,
      days: grantDays.value,
      year: queryYear.value,
    };
    if (remarks) params.remarks = remarks;
    console.warn('[lieuAdmin] 調用 addLieuLeaveGrantApi：params=', params);
    const data = await addLieuLeaveGrantApi(params);
    console.warn('[lieuAdmin] addLieuLeaveGrantApi 返回：', data);
    // 后端按 work_date.year 落库，把查看年份切到该年，列表才能显示刚发放的明细
    queryYear.value = Number(grantWorkDate.value.slice(0, 4));
    queryResult.value = data;
    grantRemarks.value = '';
    await refreshGrants();
    toastSuccess(
      $t('page.leave.calendarView.lieuAdmin.grantSuccess', {
        days: grantDays.value,
      }),
    );
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

    <div class="lieu-admin__toolbar">
      <ElSelect
        v-model="targetEmployeeId"
        filterable
        :placeholder="$t('page.leave.calendarView.lieuAdmin.selectEmployee')"
        style="width: 240px"
      >
        <ElOption
          v-for="emp in props.employees"
          :key="emp.id"
          :label="`${emp.name}（${emp.username}）`"
          :value="emp.id"
        />
      </ElSelect>

      <ElInputNumber
        v-model="queryYear"
        :min="2000"
        :max="2100"
        :step="1"
        style="width: 140px"
      />
      <ElButton type="primary" :loading="loading" @click="querySummary">
        {{ $t('page.leave.calendarView.lieuAdmin.query') }}
      </ElButton>

      <ElInputNumber
        v-model="grantDays"
        :min="0.5"
        :step="0.5"
        :precision="1"
        style="width: 140px"
      />
      <ElDatePicker
        v-model="grantWorkDate"
        type="date"
        value-format="YYYY-MM-DD"
        :placeholder="
          $t('page.leave.calendarView.lieuAdmin.workDatePlaceholder')
        "
        style="width: 180px"
      />
      <ElInput
        v-model="grantRemarks"
        :maxlength="500"
        :placeholder="
          $t('page.leave.calendarView.lieuAdmin.remarksPlaceholder')
        "
        style="width: 220px"
      />
      <ElButton type="success" :loading="loading" @click="grant">
        {{ $t('page.leave.calendarView.lieuAdmin.grant') }}
      </ElButton>
    </div>

    <div v-if="queryResult" class="lieu-admin__stats">
      <div v-for="tile in statsTiles" :key="tile.key" class="lieu-admin__stat">
        <div class="lieu-admin__stat-label">{{ tile.label }}</div>
        <div class="lieu-admin__stat-value">{{ tile.value }}</div>
      </div>
    </div>

    <div v-if="queryResult" class="lieu-admin__grants">
      <div class="lieu-admin__grants-title">
        {{ $t('page.leave.calendarView.lieuAdmin.grantsTitle') }}
      </div>
      <ElTable :data="grants" border size="small">
        <ElTableColumn
          :label="$t('page.leave.calendarView.lieuAdmin.colWorkDate')"
          min-width="120"
          prop="work_date"
        />
        <ElTableColumn
          :label="$t('page.leave.calendarView.lieuAdmin.colDays')"
          min-width="80"
          prop="days"
        />
        <ElTableColumn
          :label="$t('page.leave.calendarView.lieuAdmin.colRemarks')"
          min-width="200"
          prop="remarks"
        >
          <template #default="{ row }">
            <span v-if="row.remarks">{{ row.remarks }}</span>
            <span v-else class="lieu-admin__muted">—</span>
          </template>
        </ElTableColumn>
        <ElTableColumn
          :label="$t('page.leave.calendarView.lieuAdmin.colExpiresOn')"
          min-width="120"
          prop="expires_on"
        />
      </ElTable>
    </div>
  </ElCard>
</template>

<style scoped>
.lieu-admin__toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
}

.lieu-admin__stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-top: 16px;
}

.lieu-admin__stat {
  padding: 12px 16px;
  background: hsl(var(--muted));
  border-radius: 10px;
}

.lieu-admin__stat-label {
  font-size: 12px;
  color: hsl(var(--muted-foreground));
}

.lieu-admin__stat-value {
  margin-top: 6px;
  font-size: 20px;
  font-weight: 700;
}

.lieu-admin__grants {
  margin-top: 16px;
}

.lieu-admin__grants-title {
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 600;
}

.lieu-admin__muted {
  color: hsl(var(--muted-foreground));
}
</style>
