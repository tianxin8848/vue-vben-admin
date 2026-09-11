<script lang="ts" setup>
import type { LeaveRequestApi } from '#/api';

import { computed, onMounted, reactive, ref, watch } from 'vue';

import { Page, useVbenModal } from '@vben/common-ui';

import {
  ElButton,
  ElCard,
  ElCol,
  ElDatePicker,
  ElDivider,
  ElForm,
  ElFormItem,
  ElInput,
  ElMessage,
  ElOption,
  ElRow,
  ElSegmented,
  ElSelect,
  ElTag,
  ElUpload,
} from 'element-plus';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  createLeaveRequestApi,
  getAnnualLeaveSummaryApi,
  getBoughtForwardSummaryApi,
  getMyLeaveRequestsApi,
  getMyLieuLeaveSummaryApi,
  withdrawLeaveRequestApi,
} from '#/api';
import { $t } from '#/locales';

import CalendarPanel from '../components/CalendarPanel.vue';
import {
  leaveTypeLabelOverride,
  loadLeaveTypeLabels,
} from '../shared/leave-types';
import {
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

// 病假证明文件
const medicalCertificate = ref<File | null>(null);
const isSickLeave = computed(() => form.leave_type === 'sick');

const leaveRequests = ref<LeaveRequestApi.LeaveRequest[]>([]);
const lieuSummary = ref<LeaveRequestApi.LieuLeaveSummary | null>(null);
const boughtForwardSummary = ref<LeaveRequestApi.BoughtForwardSummary | null>(
  null,
);
const hideWithdrawnOrRejected = ref(false);

// 请假类型映射：直接用接口 system-settings.leave_types（code → 显示文本）
const leaveTypeOptions = computed(() => leaveTypeLabelOverride.value);
const sessionOptions = computed(() => createSessionOptions($t));
const statusOptions = computed(() => createStatusOptions($t));
const tableColumns = computed(() => createTableColumns($t));
const sharedToolbarConfig = computed(() => createSharedToolbarConfig($t));

// Tab 状态
type TabKey = 'calendar' | 'records';
const activeTab = ref<TabKey>('records');
const segmentedOptions = computed(() => [
  { label: $t('page.leave.employeeLeave.recordsTab'), value: 'records' },
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

  // 年假累计（原始精度）：data1.annual_entitlement_raw，前端四舍五入到整数
  const accrualRaw = annualSummary.value?.annual_entitlement_raw;

  return {
    recordCount: yearRecords.length,
    dayCount: Object.keys(dayMap.value).length,
    pendingCount: yearRecords.filter(
      (item) => item.approval_status === 'pending',
    ).length,
    // 年假：data1.annual_entitlement_days
    annualEntitlement: annualSummary.value?.annual_entitlement_days ?? '-',
    annualLeaveAccrual:
      accrualRaw === null || accrualRaw === undefined
        ? '-'
        : Math.round(accrualRaw),
    // 年假已用：data1.annual_used_days
    annualUsed: annualSummary.value?.annual_used_days ?? '-',
    // 年假可用：data1.annual_available_days
    annualAvailable: annualSummary.value?.annual_available_days ?? '-',
    // 调休已授予：data2.lieu_granted_days
    lieuGranted: lieuSummary.value?.lieu_granted_days ?? '-',
    // 调休可用：data2.lieu_available_days
    lieuAvailable: lieuSummary.value?.lieu_available_days ?? '-',
    // 调休已用：data2.lieu_used_days
    lieuUsed: lieuSummary.value?.lieu_used_days ?? '-',
    // 结转已用：data3.carry_over_used_days
    carryForward: boughtForwardSummary.value?.carry_over_used_days ?? '-',
    // 结转可用：data3.carry_over_available_days
    broughtForward:
      boughtForwardSummary.value?.carry_over_available_days ?? '-',
  };
});

// 统计卡片分组配置（与 i18n key 对应）
const statGroups = computed(() => [
  {
    groupKey: 'annual',
    items: [
      {
        statKey: 'annualEntitlement',
        labelKey: 'page.leave.employeeLeave.stats.annualEntitlement',
      },
      {
        statKey: 'annualLeaveAccrual',
        labelKey: 'page.leave.employeeLeave.stats.annualLeaveAccrual',
      },
      {
        statKey: 'annualUsed',
        labelKey: 'page.leave.employeeLeave.stats.annualUsed',
      },
      {
        statKey: 'annualAvailable',
        labelKey: 'page.leave.employeeLeave.stats.annualAvailable',
      },
    ],
  },
  {
    groupKey: 'lieu',
    items: [
      {
        statKey: 'lieuGranted',
        labelKey: 'page.leave.employeeLeave.stats.lieuGranted',
      },
      {
        statKey: 'lieuAvailable',
        labelKey: 'page.leave.employeeLeave.stats.lieuAvailable',
      },
      {
        statKey: 'lieuUsed',
        labelKey: 'page.leave.employeeLeave.stats.lieuUsed',
      },
    ],
  },
  {
    groupKey: 'carryover',
    items: [
      {
        statKey: 'carryForward',
        labelKey: 'page.leave.employeeLeave.stats.carryForward',
      },
      {
        statKey: 'broughtForward',
        labelKey: 'page.leave.employeeLeave.stats.broughtForward',
      },
    ],
  },
]);

// 病假证明文件选择 / 移除
function handleMedicalCertificateChange(file: { raw?: File }) {
  medicalCertificate.value = file.raw ?? null;
}

function handleMedicalCertificateRemove() {
  medicalCertificate.value = null;
}

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

  if (isSickLeave.value && !medicalCertificate.value) {
    ElMessage.warning(
      $t('page.leave.employeeLeave.validation.medicalCertificateRequired'),
    );
    return;
  }

  modalApi.setState({ confirmLoading: true });
  try {
    await createLeaveRequestApi(
      {
        leave_type: form.leave_type,
        start_date: form.start_date,
        end_date: form.end_date,
        session: form.session,
        handover_to: form.handover_to || null,
        reason: form.reason || null,
      },
      medicalCertificate.value,
    );

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
  medicalCertificate.value = null;
}

// 撤回请假申请
async function handleWithdraw(id: string) {
  // withdrawLeaveRequestApi 实际请求：PATCH /api/v1/me/leave-requests/{id}/withdraw
  console.warn('[withdraw] request =>', {
    method: 'PATCH',
    url: `/api/v1/me/leave-requests/${id}/withdraw`,
    id,
  });
  try {
    const result = await withdrawLeaveRequestApi(id);
    console.warn('[withdraw] response =>', result);
    ElMessage.success($t('page.leave.employeeLeave.message.withdrawSuccess'));
    await fetchData();
  } catch (error) {
    console.error('[withdraw] failed =>', error);
    ElMessage.error($t('page.leave.employeeLeave.message.withdrawFailed'));
  }
}

// 加载数据
async function fetchData() {
  loading.value = true;
  try {
    const [requests, summary, lieu, boughtForward] = await Promise.all([
      getMyLeaveRequestsApi().catch((error) => {
        console.error('[employee-leave] getMyLeaveRequestsApi 失敗：', error);
        return [];
      }),
      getAnnualLeaveSummaryApi(currentYear.value).catch((error) => {
        console.error(
          '[employee-leave] getAnnualLeaveSummaryApi 失敗：',
          error,
        );
        return null;
      }),
      getMyLieuLeaveSummaryApi(currentYear.value).catch((error) => {
        console.error('[employee-leave] getMyLiuLeaveSummaryApi 失敗：', error);
        return null;
      }),
      getBoughtForwardSummaryApi(currentYear.value).catch((error) => {
        console.error(
          '[employee-leave] getBoughtForwardSummaryApi 失敗：',
          error,
        );
        return null;
      }),
    ]);

    // 调试输出（临时保留用于验证 total_days，后续移除）
    //   使用 console.warn 而非 console.log 以通过 no-console 规则
    //   （oxlint/eslint no-console 仅允许 warn/error）
    console.warn(
      '[employee-leave] getMyLeaveRequestsApi 返回數量：',
      requests?.length,
      requests,
    );
    console.warn('[employee-leave] annualSummary：', summary);
    console.warn('[employee-leave] lieuSummary：', lieu);
    console.warn('[employee-leave] boughtForwardSummary：', boughtForward);

    if (requests && requests.length > 0) {
      const first = requests[0] ?? {};
      console.warn(
        '[employee-leave] requests[0] 全部字段：',
        Object.keys(first),
        'total_days =',
        (first as any).total_days,
      );
    }

    leaveRequests.value = requests || [];
    annualSummary.value = summary;
    lieuSummary.value = lieu;
    boughtForwardSummary.value = boughtForward;
    refreshTable();
  } catch (error) {
    console.error('[employee-leave] fetchData 整體失敗：', error);
    leaveRequests.value = [];
    annualSummary.value = null;
    lieuSummary.value = null;
    boughtForwardSummary.value = null;
  } finally {
    loading.value = false;
  }
}

// 加载请假类型目录（来自 system-settings.leave_types）
async function fetchLeaveTypes() {
  await loadLeaveTypeLabels();
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
      <ElCard
        v-show="activeTab === 'records'"
        class="mb-4 flex-shrink-0"
        shadow="never"
        body-style="padding: 16px;"
      >
        <template v-for="group in statGroups" :key="group.groupKey">
          <ElDivider content-position="left">
            {{ $t(`page.leave.employeeLeave.group.${group.groupKey}`) }}
          </ElDivider>
          <ElRow :gutter="12">
            <ElCol
              v-for="item in group.items"
              :key="item.statKey"
              :xs="24"
              :sm="12"
              :md="8"
              :lg="6"
            >
              <ElCard
                shadow="hover"
                class="mb-3"
                body-style="padding: 14px 16px;"
              >
                <div
                  class="min-h-10 text-xs leading-tight text-muted-foreground"
                >
                  {{ $t(item.labelKey) }}
                </div>
                <div class="mt-2 text-2xl font-bold">
                  {{ stats[item.statKey as keyof typeof stats] }}
                </div>
              </ElCard>
            </ElCol>
          </ElRow>
        </template>
      </ElCard>

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

        <ElFormItem
          v-if="isSickLeave"
          :label="$t('page.leave.employeeLeave.form.medicalCertificate')"
          required
        >
          <ElUpload
            :auto-upload="false"
            :limit="1"
            :on-change="handleMedicalCertificateChange"
            :on-remove="handleMedicalCertificateRemove"
            :on-exceed="
              () =>
                medicalCertificate &&
                ElMessage.warning(
                  $t(
                    'page.leave.employeeLeave.validation.medicalCertificateSingle',
                  ),
                )
            "
          >
            <ElButton type="primary" plain>
              {{ $t('page.leave.employeeLeave.form.medicalCertificateButton') }}
            </ElButton>
            <template #tip>
              <div style="font-size: 12px; color: hsl(var(--muted-foreground))">
                {{ $t('page.leave.employeeLeave.form.medicalCertificateHint') }}
              </div>
            </template>
          </ElUpload>
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
