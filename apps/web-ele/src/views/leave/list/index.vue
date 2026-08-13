<script lang="ts" setup>
import type { VxeGridProps } from '#/adapter/vxe-table';
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
  getMyLeaveRequestsApi,
  withdrawLeaveRequestApi,
} from '#/api';

import CalendarPanel from '../calendar/components/CalendarPanel.vue';

const loading = ref(false);

// 请假类型映射
const leaveTypeOptions: Record<string, string> = {
  annual: '年假',
  personal: '事假',
  sick: '病假',
  lieu: '调休',
  long: '长假',
};

// 请假时段映射
const sessionOptions: Record<string, string> = {
  full_day: '全天',
  morning: '上午',
  afternoon: '下午',
};

// 审批状态映射
const statusOptions: Record<string, string> = {
  pending: '待审批',
  approved: '已批准',
  rejected: '已驳回',
  withdrawn: '已撤回',
};

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
const hideWithdrawnOrRejected = ref(false);

// Tab 状态
type TabKey = 'calendar' | 'records';
const activeTab = ref<TabKey>('records');
const segmentedOptions = computed(() => [
  { label: '请假记录', value: 'records' },
  { label: '年历视图', value: 'calendar' },
]);

// 表格列配置
const tableColumns: VxeGridProps['columns'] = [
  {
    field: 'date_range',
    title: '日期范围',
    minWidth: 200,
    slots: { default: 'date_range' },
  },
  {
    field: 'leave_type',
    title: '请假类型',
    width: 120,
    align: 'center',
    slots: { default: 'leave_type' },
  },
  {
    field: 'session',
    title: '时段',
    width: 100,
    align: 'center',
    slots: { default: 'session' },
  },
  {
    field: 'approval_status',
    title: '状态',
    width: 120,
    align: 'center',
    slots: { default: 'status' },
  },
  {
    field: 'created_at',
    title: '创建时间',
    width: 180,
    slots: { default: 'created_at' },
  },
  {
    title: '操作',
    width: 120,
    fixed: 'right',
    slots: { default: 'action' },
  },
];

// 表格工具栏配置
const sharedToolbarConfig: VxeGridProps['toolbarConfig'] = {
  custom: true,
  tools: [
    {
      code: 'manual-refresh',
      icon: 'vxe-icon-refresh',
      circle: true,
      name: '刷新',
    },
  ],
};

// 创建BasicTable实例
const [BasicTable, tableApi] = useVbenVxeGrid({
  gridOptions: {
    id: 'leave-list',
    rowConfig: { keyField: 'id' },
    columns: tableColumns,
    proxyConfig: { enabled: false },
    keepSource: true,
    toolbarConfig: sharedToolbarConfig,
  },
  gridEvents: {
    toolbarToolClick(event: { code: string }) {
      if (event.code === 'manual-refresh') fetchData();
    },
  },
});

// 刷新表格
function refreshTable() {
  tableApi.setGridOptions({
    data: filteredLeaveRequests.value,
  });
}

function statusTagType(
  status: string,
): 'danger' | 'info' | 'primary' | 'success' | 'warning' | undefined {
  const map: Record<
    string,
    'danger' | 'info' | 'primary' | 'success' | 'warning'
  > = {
    pending: 'warning',
    approved: 'success',
    rejected: 'danger',
    withdrawn: 'info',
  };
  return map[status] ?? 'info';
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

  return {
    recordCount: yearRecords.length,
    dayCount: Object.keys(dayMap.value).length,
    pendingCount: yearRecords.filter(
      (item) => item.approval_status === 'pending',
    ).length,
    annualEntitlement: annualSummary.value?.entitlement_days ?? '-',
    annualAvailable: annualSummary.value?.available_days ?? '-',
  };
});

// 提交请假申请
async function handleSubmit() {
  if (!form.start_date || !form.end_date) {
    ElMessage.warning('请完整选择请假日期');
    return;
  }

  if (form.start_date > form.end_date) {
    ElMessage.warning('开始日期不能晚于结束日期');
    return;
  }

  if (form.session !== 'full_day' && form.start_date !== form.end_date) {
    ElMessage.warning('上午或下午请假仅支持单日申请');
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

    ElMessage.success('请假申请已提交');
    resetForm();
    modalApi.close();
    await fetchData();
  } catch {
    ElMessage.error('提交失败');
  } finally {
    modalApi.setState({ confirmLoading: false });
  }
}

const [Modal, modalApi] = useVbenModal({
  title: '填写请假单',
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
    ElMessage.success('已撤回');
    await fetchData();
  } catch {
    ElMessage.error('撤回失败');
  }
}

// 加载数据
async function fetchData() {
  loading.value = true;
  try {
    const [requests, summary] = await Promise.all([
      getMyLeaveRequestsApi(),
      getAnnualLeaveSummaryApi(currentYear.value),
    ]);
    leaveRequests.value = requests || [];
    annualSummary.value = summary;
    refreshTable();
  } catch {
    leaveRequests.value = [];
    annualSummary.value = null;
  } finally {
    loading.value = false;
  }
}

// 年份切换
async function changeYear(year: number) {
  currentYear.value = year;
  selectedDateKey.value = '';
  try {
    annualSummary.value = await getAnnualLeaveSummaryApi(year);
  } catch {
    annualSummary.value = null;
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
});
</script>

<template>
  <Page
    title="我的请假"
    description="提交自己的请假申请,查看请假记录与年历"
    :auto-content-height="true"
    v-loading="loading"
  >
    <div class="flex h-full flex-col gap-2">
      <ElSegmented v-model="activeTab" :options="segmentedOptions" />

      <BasicTable
        v-show="activeTab === 'records'"
        :table-title="`我的请假记录（${filteredLeaveRequests.length} 条）`"
        class="min-h-0"
      >
        <template #toolbar-tools>
          <ElButton type="primary" @click="() => modalApi.open()">
            填写请假单
          </ElButton>
          <ElButton @click="hideWithdrawnOrRejected = !hideWithdrawnOrRejected">
            {{ hideWithdrawnOrRejected ? '显示全部' : '隐藏撤回/驳回' }}
          </ElButton>
        </template>

        <template #date_range="{ row }">
          {{
            row.start_date === row.end_date
              ? row.start_date
              : `${row.start_date} 至 ${row.end_date}`
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
            撤回
          </ElButton>
          <span v-else style="color: hsl(var(--muted-foreground))">-</span>
        </template>
      </BasicTable>

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
          >
            <div>
              <h3 style="margin: 0">我的请假年历</h3>
              <p
                style="
                  margin: 8px 0 0;
                  font-size: 14px;
                  color: hsl(var(--muted-foreground));
                "
              >
                按年查看自己的请假分布，直接看到每一天的请假类型和状态。
              </p>
            </div>
            <div
              style="
                display: flex;
                flex-wrap: wrap;
                gap: 10px;
                align-items: center;
              "
            >
              <ElButton size="small" @click="changeYear(currentYear - 1)">
                上一年
              </ElButton>
              <span
                style="
                  display: inline-flex;
                  align-items: center;
                  justify-content: center;
                  min-width: 88px;
                  padding: 10px 14px;
                  font-weight: 700;
                  color: hsl(var(--foreground));
                  background: hsl(var(--accent));
                  border-radius: 10px;
                "
              >
                {{ currentYear }}
              </span>
              <ElButton size="small" @click="changeYear(currentYear + 1)">
                下一年
              </ElButton>
              <ElButton
                size="small"
                type="primary"
                @click="changeYear(new Date().getFullYear())"
              >
                回到今年
              </ElButton>
            </div>
          </div>
        </template>

        <!-- 统计数据 -->
        <div
          style="
            display: grid;
            grid-template-columns: repeat(5, 1fr);
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
              当年请假记录
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
              当年覆盖天数
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
              待审批记录
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
              当年年假总计
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
              当年年假可用
            </div>
            <div style="margin-top: 8px; font-size: 22px; font-weight: 700">
              {{ stats.annualAvailable }}
            </div>
          </div>
        </div>

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
            {{ selectedDateKey }} · 日期详情
          </h4>
          <div
            v-if="!dayMap[selectedDateKey]?.length"
            style="color: hsl(var(--muted-foreground))"
          >
            当天没有请假记录。
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
              <div>类型：{{ leaveTypeOptions[item.leave_type] }}</div>
              <div>时段：{{ sessionOptions[item.session] }}</div>
              <div>状态：{{ statusOptions[item.approval_status] }}</div>
              <div>说明：{{ item.reason || '-' }}</div>
            </div>
          </div>
        </div>
      </ElCard>
    </div>

    <Modal class="w-150" title="填写请假单">
      <ElForm :model="form" label-width="100px">
        <ElFormItem label="请假类型" required>
          <ElSelect v-model="form.leave_type" style="width: 100%">
            <ElOption
              v-for="(label, value) in leaveTypeOptions"
              :key="value"
              :label="label"
              :value="value"
            />
          </ElSelect>
        </ElFormItem>

        <ElFormItem label="开始日期" required>
          <ElDatePicker
            v-model="form.start_date"
            type="date"
            value-format="YYYY-MM-DD"
            placeholder="选择开始日期"
            style="width: 100%"
          />
        </ElFormItem>

        <ElFormItem label="结束日期" required>
          <ElDatePicker
            v-model="form.end_date"
            type="date"
            value-format="YYYY-MM-DD"
            placeholder="选择结束日期"
            style="width: 100%"
          />
        </ElFormItem>

        <ElFormItem label="请假时段" required>
          <ElSelect v-model="form.session" style="width: 100%">
            <ElOption
              v-for="(label, value) in sessionOptions"
              :key="value"
              :label="label"
              :value="value"
            />
          </ElSelect>
        </ElFormItem>

        <ElFormItem label="工作交接人">
          <ElInput v-model="form.handover_to" placeholder="选填" clearable />
        </ElFormItem>

        <ElFormItem label="请假说明">
          <ElInput
            v-model="form.reason"
            type="textarea"
            :rows="3"
            placeholder="请填写请假原因"
          />
        </ElFormItem>

        <div
          style="
            font-size: 13px;
            line-height: 1.7;
            color: hsl(var(--muted-foreground));
          "
        >
          说明：半天请假仅支持单日申请；提交后会写入
          leave_requests，审批状态默认是"待审批"。
        </div>
      </ElForm>
    </Modal>
  </Page>
</template>
