<script lang="ts" setup>
import type { CalendarEmployee } from '../composables/useCalendarData';

import type { LeaveRequestApi } from '#/api';

import { computed, ref } from 'vue';

import {
  ElButton,
  ElCard,
  ElInputNumber,
  ElMessage,
  ElOption,
  ElSelect,
} from 'element-plus';

import { addLieuLeaveGrantApi, getLieuLeaveSummaryApi } from '#/api';
import { $t } from '#/locales';

const props = defineProps<{
  /** 员工目录，供下拉选择调休额度归属人 */
  employees: CalendarEmployee[];
}>();

const targetEmployeeId = ref('');
const queryYear = ref(new Date().getFullYear());
const queryResult = ref<LeaveRequestApi.LieuLeaveSummary | null>(null);
const grantDays = ref(1);
const loading = ref(false);

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
  ElMessage.warning($t('page.leave.calendarView.lieuAdmin.selectEmployee'));
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
  } catch (error) {
    console.error(
      '[lieuAdmin] getLieuLeaveSummaryApi 失敗：',
      error,
      'employeeId=',
      targetEmployeeId.value,
      'year=',
      queryYear.value,
    );
    queryResult.value = null;
    ElMessage.error($t('page.leave.calendarView.lieuAdmin.queryFailed'));
  } finally {
    loading.value = false;
  }
}

async function grant() {
  if (!targetEmployeeId.value) {
    warnSelectEmployee();
    return;
  }
  if (!grantDays.value || grantDays.value <= 0) {
    ElMessage.warning($t('page.leave.calendarView.lieuAdmin.daysPositive'));
    return;
  }
  loading.value = true;
  try {
    const params = {
      employee_id: targetEmployeeId.value,
      year: queryYear.value,
      days: grantDays.value,
    };
    console.warn('[lieuAdmin] 調用 addLieuLeaveGrantApi：params=', params);
    const data = await addLieuLeaveGrantApi(params);
    console.warn('[lieuAdmin] addLieuLeaveGrantApi 返回：', data);
    queryResult.value = data;
    ElMessage.success(
      $t('page.leave.calendarView.lieuAdmin.grantSuccess', {
        days: grantDays.value,
      }),
    );
  } catch (error) {
    console.error(
      '[lieuAdmin] addLieuLeaveGrantApi 失敗：',
      error,
      'employeeId=',
      targetEmployeeId.value,
      'year=',
      queryYear.value,
      'days=',
      grantDays.value,
    );
    ElMessage.error($t('page.leave.calendarView.lieuAdmin.grantFailed'));
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
</style>
