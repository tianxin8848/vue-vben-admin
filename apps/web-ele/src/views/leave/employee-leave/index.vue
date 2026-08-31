<script lang="ts" setup>
import type { LeaveRequestApi } from '#/api';

import { computed, onMounted, reactive, ref, watch } from 'vue';

import { Page, useVbenModal } from '@vben/common-ui';

import {
  ElButton,
  ElCard,
  ElDatePicker,
  ElForm,
  ElFormItem,
  ElInput,
  ElMessage,
  ElOption,
  ElSegmented,
  ElSelect,
  ElTag,
} from 'element-plus';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  createLeaveRequestApi,
  getAnnualLeaveSummaryApi,
  getMyDepartmentLeaveRequestsApi,
  getMyLeaveRequestsApi,
  getMyLeaveTypesApi,
  getMyLieuLeaveSummaryApi,
  withdrawLeaveRequestApi,
} from '#/api';
import { $t } from '#/locales';

import CalendarPanel from '../components/CalendarPanel.vue';
import {
  createLeaveTypeOptions,
  createSessionOptions,
  createSharedToolbarConfig,
  createStatusOptions,
  createTableColumns,
  statusTagType,
} from './data';

const loading = ref(false);

// 表单数据
const form = reactive<LeaveRequestApi.CreateLeaveRequestParams>({
  leave_type: 'annual',
  start_date: '',
  end_date: '',
  session: 'full_day',
  handover_to: null,
  reason: null,
});

const leaveRequests = ref<LeaveRequestApi.LeaveRequest[]>([]);
const departmentRequests = ref<LeaveRequestApi.LeaveRequest[]>([]);
const remoteLeaveTypes = ref<LeaveRequestApi.LeaveTypeOption[]>([]);
const lieuSummary = ref<LeaveRequestApi.LieuLeaveSummary | null>(null);
const hideWithdrawnOrRejected = ref(false);

// 响应式 i18n 映射（接口返回的 code 优先，未覆盖时回退到本地映射）
const leaveTypeOptions = computed(() => {
  const fallback = createLeaveTypeOptions($t);
  const merged: Record<string, string> = { ...fallback };
  remoteLeaveTypes.value.forEach((item) => {
    merged[item.code] = item.label;
  });
  return merged;
});
const sessionOptions = computed(() => createSessionOptions($t));
const statusOptions = computed(() => createStatusOptions($t));
const tableColumns = computed(() => createTableColumns($t));
const sharedToolbarConfig = computed(() => createSharedToolbarConfig($t));

// Tab 状态
type TabKey = 'calendar' | 'department' | 'records';
const activeTab = ref<TabKey>('records');
const segmentedOptions = computed(() => [
  { label: $t('page.leave.employeeLeave.recordsTab'), value: 'records' },
  { label: $t('page.leave.employeeLeave.departmentTab'), value: 'department' },
  { label: $t('page.leave.employeeLeave.calendarTab'), value: 'calendar' },
]);

// 创建BasicTable实例
const [BasicTable, tableApi] = useVbenVxeGrid({
  gridOptions: {
    id: 'leave-list',
    rowConfig: { keyField: 'id' },
    columns: tableColumns.value,
    proxyConfig: { enabled: false },
    keepSource: true,
    toolbarConfig: sharedToolbarConfig.value,
  },
  gridEvents: {
    toolbarToolClick(event: { code: string }) {
      if (event.code === 'manual-refresh') fetchData();
    },
  },
});

// 监听语言切换，更新表格列
watch([tableColumns, sharedToolbarConfig], () => {
  tableApi.setGridOptions({
    columns: tableColumns.value,
    toolbarConfig: sharedToolbarConfig.value,
  });
  refreshTable();
});

// 刷新表格
function refreshTable() {
  tableApi.setGridOptions({
    data: filteredLeaveRequests.value,
  });
}

// 年假汇总
const annualSummary = ref<LeaveRequestApi.AnnualLeaveSummary | null>(null);

// 切换 Tab 时按需加载部门请假
watch(activeTab, (tab) => {
  if (tab === 'department' && departmentRequests.value.length === 0) {
    fetchDepartmentData();
  }
});

// 年历相关
const currentYear = ref(new Date().getFullYear());
const selectedDateKey = ref('');

// 筛选后的请假记录
const filteredLeaveRequests = computed(() => {
  if (!hideWithdrawnOrRejected.value) {
    return leaveRequests.value;
  }
  return leaveRequests.value.filter(
    (item) =>
      item.approval_status !== 'withdrawn' &&
      item.approval_status !== 'rejected',
  );
});

// 监听数据变化刷新表格
watch(filteredLeaveRequests, () => {
  refreshTable();
});

// 年历数据映射
const dayMap = computed(() => {
  const map: Record<string, LeaveRequestApi.LeaveRequest[]> = {};
  filteredLeaveRequests.value.forEach((record) => {
    (record.date_keys || []).forEach((dateKey) => {
      if (!dateKey.startsWith(`${currentYear.value}-`)) return;
      map[dateKey] = map[dateKey] || [];
      map[dateKey].push({ ...record });
    });
  });
  return map;
});

// 统计数据
const stats = computed(() => {
  const yearRecords = filteredLeaveRequests.value.filter((item) =>
    (item.date_keys || []).some((dateKey) =>
      dateKey.startsWith(`${currentYear.value}-`),
    ),
  );

  return {
    recordCount: yearRecords.length,
    dayCount: Object.keys(dayMap.value).length,
    pendingCount: yearRecords.filter(
      (item) => item.approval_status === 'pending',
    ).length,
    annualEntitlement: annualSummary.value?.entitlement_days ?? '-',
    annualAvailable: annualSummary.value?.available_days ?? '-',
    lieuGranted: lieuSummary.value?.granted_days ?? '-',
    lieuAvailable: lieuSummary.value?.available_days ?? '-',
  };
});

// 提交请假申请
async function handleSubmit() {
  if (!form.start_date || !form.end_date) {
    ElMessage.warning($t('page.leave.employeeLeave.validation.completeDates'));
    return;
  }

  if (form.start_date > form.end_date) {
    ElMessage.warning($t('page.leave.employeeLeave.validation.startAfterEnd'));
    return;
  }

  if (form.session !== 'full_day' && form.start_date !== form.end_date) {
    ElMessage.warning(
      $t('page.leave.employeeLeave.validation.sessionSingleDay'),
    );
    return;
  }

  modalApi.setState({ confirmLoading: true });
  try {
    await createLeaveRequestApi({
      leave_type: form.leave_type,
      start_date: form.start_date,
      end_date: form.end_date,
      session: form.session,
      handover_to: form.handover_to || null,
      reason: form.reason || null,
    });

    ElMessage.success($t('page.leave.employeeLeave.message.submitSuccess'));
    resetForm();
    modalApi.close();
    await fetchData();
  } catch {
    ElMessage.error($t('page.leave.employeeLeave.message.submitFailed'));
  } finally {
    modalApi.setState({ confirmLoading: false });
  }
}

const [Modal, modalApi] = useVbenModal({
  title: $t('page.leave.employeeLeave.modal.title'),
  onConfirm: handleSubmit,
  onCancel: () => {
    resetForm();
    modalApi.close();
  },
  onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      resetForm();
    }
  },
});

// 重置表单
function resetForm() {
  form.leave_type = 'annual';
  form.start_date = '';
  form.end_date = '';
  form.session = 'full_day';
  form.handover_to = null;
  form.reason = null;
}

// 撤回请假申请
async function handleWithdraw(id: string) {
  try {
    await withdrawLeaveRequestApi(id);
    ElMessage.success($t('page.leave.employeeLeave.message.withdrawSuccess'));
    await fetchData();
  } catch {
    ElMessage.error($t('page.leave.employeeLeave.message.withdrawFailed'));
  }
}

// 加载数据
async function fetchData() {
  loading.value = true;
  try {
    const [requests, summary, lieu] = await Promise.all([
      getMyLeaveRequestsApi(),
      getAnnualLeaveSummaryApi(currentYear.value),
      getMyLieuLeaveSummaryApi(currentYear.value).catch(() => null),
    ]);
    leaveRequests.value = requests || [];
    annualSummary.value = summary;
    lieuSummary.value = lieu;
    refreshTable();
  } catch {
    leaveRequests.value = [];
    annualSummary.value = null;
    lieuSummary.value = null;
  } finally {
    loading.value = false;
  }
}

// 加载同部门请假
async function fetchDepartmentData() {
  try {
    const data = await getMyDepartmentLeaveRequestsApi();
    departmentRequests.value = data || [];
  } catch {
    departmentRequests.value = [];
  }
}

// 加载请假类型目录
async function fetchLeaveTypes() {
  try {
    const data = await getMyLeaveTypesApi();
    remoteLeaveTypes.value = data || [];
  } catch {
    remoteLeaveTypes.value = [];
  }
}

// 日期选择
function onSelectDate(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  selectedDateKey.value = `${y}-${m}-${d}`;
}

onMounted(() => {
  fetchData();
  fetchLeaveTypes();
});
</script>

<template>
  <Page>
    <div class="flex h-full flex-col gap-2">
      <ElSegmented v-model="activeTab" :options="segmentedOptions" />

      <!-- 统计数据 -->
      <div
        v-show="activeTab === 'records'"
        style="
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 12px;
          margin-bottom: 16px;
        "
      >
        <div
          style="
            padding: 14px 16px;
            background: hsl(var(--muted));
            border-radius: 14px;
          "
        >
          <div style="font-size: 13px; color: hsl(var(--muted-foreground))">
            {{ $t('page.leave.employeeLeave.stats.recordCount') }}
          </div>
          <div style="margin-top: 8px; font-size: 22px; font-weight: 700">
            {{ stats.recordCount }}
          </div>
        </div>
        <div
          style="
            padding: 14px 16px;
            background: hsl(var(--muted));
            border-radius: 14px;
          "
        >
          <div style="font-size: 13px; color: hsl(var(--muted-foreground))">
            {{ $t('page.leave.employeeLeave.stats.dayCount') }}
          </div>
          <div style="margin-top: 8px; font-size: 22px; font-weight: 700">
            {{ stats.dayCount }}
          </div>
        </div>
        <div
          style="
            padding: 14px 16px;
            background: hsl(var(--muted));
            border-radius: 14px;
          "
        >
          <div style="font-size: 13px; color: hsl(var(--muted-foreground))">
            {{ $t('page.leave.employeeLeave.stats.pendingCount') }}
          </div>
          <div style="margin-top: 8px; font-size: 22px; font-weight: 700">
            {{ stats.pendingCount }}
          </div>
        </div>
        <div
          style="
            padding: 14px 16px;
            background: hsl(var(--muted));
            border-radius: 14px;
          "
        >
          <div style="font-size: 13px; color: hsl(var(--muted-foreground))">
            {{ $t('page.leave.employeeLeave.stats.annualEntitlement') }}
          </div>
          <div style="margin-top: 8px; font-size: 22px; font-weight: 700">
            {{ stats.annualEntitlement }}
          </div>
        </div>
        <div
          style="
            padding: 14px 16px;
            background: hsl(var(--muted));
            border-radius: 14px;
          "
        >
          <div style="font-size: 13px; color: hsl(var(--muted-foreground))">
            {{ $t('page.leave.employeeLeave.stats.annualAvailable') }}
          </div>
          <div style="margin-top: 8px; font-size: 22px; font-weight: 700">
            {{ stats.annualAvailable }}
          </div>
        </div>
        <div
          style="
            padding: 14px 16px;
            background: hsl(var(--muted));
            border-radius: 14px;
          "
        >
          <div style="font-size: 13px; color: hsl(var(--muted-foreground))">
            {{ $t('page.leave.employeeLeave.stats.lieuGranted') }}
          </div>
          <div style="margin-top: 8px; font-size: 22px; font-weight: 700">
            {{ stats.lieuGranted }}
          </div>
        </div>
        <div
          style="
            padding: 14px 16px;
            background: hsl(var(--muted));
            border-radius: 14px;
          "
        >
          <div style="font-size: 13px; color: hsl(var(--muted-foreground))">
            {{ $t('page.leave.employeeLeave.stats.lieuAvailable') }}
          </div>
          <div style="margin-top: 8px; font-size: 22px; font-weight: 700">
            {{ stats.lieuAvailable }}
          </div>
        </div>
      </div>

      <BasicTable
        v-show="activeTab === 'records'"
        :table-title="
          $t('page.leave.employeeLeave.listTitle', {
            count: filteredLeaveRequests.length,
          })
        "
        class="min-h-0"
      >
        <template #toolbar-tools>
          <ElButton type="primary" @click="() => modalApi.open()">
            {{ $t('page.leave.employeeLeave.button.create') }}
          </ElButton>
          <ElButton @click="hideWithdrawnOrRejected = !hideWithdrawnOrRejected">
            {{
              hideWithdrawnOrRejected
                ? $t('page.leave.employeeLeave.button.showAll')
                : $t('page.leave.employeeLeave.button.hideWithdrawnRejected')
            }}
          </ElButton>
        </template>

        <template #date_range="{ row }">
          {{
            row.start_date === row.end_date
              ? row.start_date
              : `${row.start_date} ${$t('page.leave.employeeLeave.date.to')} ${row.end_date}`
          }}
        </template>

        <template #leave_type="{ row }">
          <ElTag type="info">{{ leaveTypeOptions[row.leave_type] }}</ElTag>
        </template>

        <template #session="{ row }">
          <ElTag>{{ sessionOptions[row.session] }}</ElTag>
        </template>

        <template #status="{ row }">
          <ElTag :type="statusTagType(row.approval_status)">
            {{ statusOptions[row.approval_status] }}
          </ElTag>
        </template>

        <template #created_at="{ row }">
          {{
            row.created_at
              ? new Date(row.created_at).toLocaleString('zh-CN')
              : '-'
          }}
        </template>

        <template #action="{ row }">
          <ElButton
            v-if="row.approval_status === 'pending'"
            size="small"
            type="danger"
            @click="handleWithdraw(row.id)"
          >
            {{ $t('page.leave.employeeLeave.button.withdraw') }}
          </ElButton>
          <span v-else style="color: hsl(var(--muted-foreground))">-</span>
        </template>
      </BasicTable>

      <!-- 同部门同事请假 -->
      <ElCard v-show="activeTab === 'department'" class="flex-1">
        <template #header>
          <span>{{
            $t('page.leave.employeeLeave.department.listTitle', {
              count: departmentRequests.length,
            })
          }}</span>
        </template>
        <div
          v-if="!departmentRequests.length"
          style="color: hsl(var(--muted-foreground))"
        >
          {{ $t('page.leave.employeeLeave.department.empty') }}
        </div>
        <div v-else style="display: flex; flex-direction: column; gap: 10px">
          <div
            v-for="item in departmentRequests"
            :key="item.id"
            style="
              display: flex;
              flex-wrap: wrap;
              gap: 12px;
              align-items: center;
              padding: 10px 12px;
              background: hsl(var(--muted));
              border-radius: 10px;
            "
          >
            <span style="font-weight: 600">{{ item.employee_name }}</span>
            <ElTag type="info">{{ leaveTypeOptions[item.leave_type] }}</ElTag>
            <ElTag>{{ sessionOptions[item.session] }}</ElTag>
            <ElTag :type="statusTagType(item.approval_status)">
              {{ statusOptions[item.approval_status] }}
            </ElTag>
            <span style="color: hsl(var(--muted-foreground))">
              {{ item.start_date }}
              <template v-if="item.start_date !== item.end_date">
                {{ $t('page.leave.employeeLeave.date.to') }}
                {{ item.end_date }}
              </template>
            </span>
            <span
              v-if="item.reason"
              style="color: hsl(var(--muted-foreground))"
            >
              {{ item.reason }}
            </span>
          </div>
        </div>
      </ElCard>

      <!-- 我的请假年历 -->
      <ElCard
        v-show="activeTab === 'calendar'"
        class="flex-1"
        style="margin-top: 0"
      >
        <template #header>
          <div
            style="
              display: flex;
              flex-wrap: wrap;
              gap: 12px;
              align-items: center;
              justify-content: space-between;
            "
          ></div>
        </template>

        <!-- 年历面板 -->
        <CalendarPanel
          :day-map="dayMap"
          :selected-date-key="selectedDateKey"
          :current-year="currentYear"
          :search-form="{ view_mode: 'standard' }"
          @select-date="onSelectDate"
          @panel-change="() => {}"
        />

        <!-- 日期详情 -->
        <div
          v-if="selectedDateKey"
          style="
            padding: 16px;
            margin-top: 16px;
            background: hsl(var(--muted));
            border-radius: 14px;
          "
        >
          <h4 style="margin: 0 0 12px; font-size: 16px">
            {{ selectedDateKey }} ·
            {{ $t('page.leave.employeeLeave.calendar.detailTitle') }}
          </h4>
          <div
            v-if="!dayMap[selectedDateKey]?.length"
            style="color: hsl(var(--muted-foreground))"
          >
            {{ $t('page.leave.employeeLeave.calendar.noRecords') }}
          </div>
          <div v-else style="display: flex; flex-direction: column; gap: 10px">
            <div
              v-for="item in dayMap[selectedDateKey]"
              :key="item.id"
              style="
                padding: 10px 0;
                font-size: 14px;
                line-height: 1.7;
                border-top: 1px solid hsl(var(--border));
              "
            >
              <div>
                {{ $t('page.leave.employeeLeave.calendar.typeLabel')
                }}{{ leaveTypeOptions[item.leave_type] }}
              </div>
              <div>
                {{ $t('page.leave.employeeLeave.calendar.sessionLabel')
                }}{{ sessionOptions[item.session] }}
              </div>
              <div>
                {{ $t('page.leave.employeeLeave.calendar.statusLabel')
                }}{{ statusOptions[item.approval_status] }}
              </div>
              <div>
                {{ $t('page.leave.employeeLeave.calendar.reasonLabel')
                }}{{ item.reason || '-' }}
              </div>
            </div>
          </div>
        </div>
      </ElCard>
    </div>

    <Modal class="w-150" :title="$t('page.leave.employeeLeave.modal.title')">
      <ElForm :model="form" label-width="100px">
        <ElFormItem
          :label="$t('page.leave.employeeLeave.form.leaveType')"
          required
        >
          <ElSelect v-model="form.leave_type" style="width: 100%">
            <ElOption
              v-for="(label, value) in leaveTypeOptions"
              :key="value"
              :label="label"
              :value="value"
            />
          </ElSelect>
        </ElFormItem>

        <ElFormItem
          :label="$t('page.leave.employeeLeave.form.startDate')"
          required
        >
          <ElDatePicker
            v-model="form.start_date"
            type="date"
            value-format="YYYY-MM-DD"
            :placeholder="
              $t('page.leave.employeeLeave.form.startDatePlaceholder')
            "
            style="width: 100%"
          />
        </ElFormItem>

        <ElFormItem
          :label="$t('page.leave.employeeLeave.form.endDate')"
          required
        >
          <ElDatePicker
            v-model="form.end_date"
            type="date"
            value-format="YYYY-MM-DD"
            :placeholder="
              $t('page.leave.employeeLeave.form.endDatePlaceholder')
            "
            style="width: 100%"
          />
        </ElFormItem>

        <ElFormItem
          :label="$t('page.leave.employeeLeave.form.session')"
          required
        >
          <ElSelect v-model="form.session" style="width: 100%">
            <ElOption
              v-for="(label, value) in sessionOptions"
              :key="value"
              :label="label"
              :value="value"
            />
          </ElSelect>
        </ElFormItem>

        <ElFormItem :label="$t('page.leave.employeeLeave.form.handoverTo')">
          <ElInput
            v-model="form.handover_to"
            :placeholder="
              $t('page.leave.employeeLeave.form.handoverToPlaceholder')
            "
            clearable
          />
        </ElFormItem>

        <ElFormItem :label="$t('page.leave.employeeLeave.form.reason')">
          <ElInput
            v-model="form.reason"
            type="textarea"
            :rows="3"
            :placeholder="$t('page.leave.employeeLeave.form.reasonPlaceholder')"
          />
        </ElFormItem>

        <div
          style="
            font-size: 13px;
            line-height: 1.7;
            color: hsl(var(--muted-foreground));
          "
        >
          {{ $t('page.leave.employeeLeave.form.hint') }}
        </div>
      </ElForm>
    </Modal>
  </Page>
</template>
