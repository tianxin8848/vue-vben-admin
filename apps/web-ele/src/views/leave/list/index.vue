<script lang="ts" setup>
import type { LeaveRequestApi } from '#/api';

import { computed, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';

import {
  ElButton,
  ElCard,
  ElDatePicker,
  ElForm,
  ElFormItem,
  ElInput,
  ElMessage,
  ElOption,
  ElSelect,
  ElTable,
  ElTableColumn,
  ElTag,
} from 'element-plus';

import {
  createLeaveRequestApi,
  getAnnualLeaveSummaryApi,
  getMyLeaveRequestsApi,
  withdrawLeaveRequestApi,
} from '#/api';

import CalendarPanel from '../calendar/components/CalendarPanel.vue';

const router = useRouter();
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

const submitting = ref(false);

// 请假记录
const leaveRequests = ref<LeaveRequestApi.LeaveRequest[]>([]);
const hideWithdrawnOrRejected = ref(false);

// 表格展开
const tableRef = ref();

function handleRowClick(row: LeaveRequestApi.LeaveRequest) {
  tableRef.value?.toggleRowExpansion(row);
}

function statusTagType(status: string): 'danger' | 'info' | 'primary' | 'success' | 'warning' | undefined {
  const map: Record<string, 'danger' | 'info' | 'primary' | 'success' | 'warning'> = {
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

  submitting.value = true;
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
    await fetchData();
  } catch {
    ElMessage.error('提交失败');
  } finally {
    submitting.value = false;
  }
}

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
  const confirmed = window.confirm('确认撤回这条请假申请吗？撤回后将不再进入审批流程。');
  if (!confirmed) return;

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

// 获取审批人标签
function getApproverLabel(item: LeaveRequestApi.LeaveRequest) {
  const chain = item.approval_chain || [];
  const currentNode = chain.find(
    (node: any) => node.user_id === item.current_approver_id,
  );
  if (!currentNode) return '-';

  const level = chain.findIndex((node: any) => node.user_id === item.current_approver_id) + 1;
  const prefix = level ? `第${level}级：` : '';
  const name = (currentNode as any).full_name || (currentNode as any).username || '-';
  return `${prefix}${name}`;
}

// 获取最新操作显示
function getLatestActionDisplay(item: LeaveRequestApi.LeaveRequest) {
  const history = item.approval_history || [];
  if (history.length === 0) return '尚未处理';

  const latest = history[history.length - 1] as any;
  const actor = latest.approver_name || '-';
  const atText = latest.at ? new Date(latest.at).toLocaleString('zh-CN') : '-';

  const actionText = {
    approved: '已通过',
    rejected: '已驳回',
    withdrawn: '已撤回',
  }[(latest.action as string)] || latest.action;

  return `${actor}${actionText} / ${atText}`;
}

// 返回工作台
function goBack() {
  router.push('/employee');
}

// 查看详情
function viewDetail(id: string) {
  router.push(`/employee/leave/detail/${id}`);
}

onMounted(() => {
  fetchData();
});
</script>

<template>
  <Page title="我的请假" description="提交自己的请假申请,查看请假记录与年历" v-loading="loading">
    <div style="margin-bottom: 16px">
      <ElButton @click="goBack">返回工作台</ElButton>
    </div>

    <div style="display: grid; grid-template-columns: minmax(320px, 420px) 1fr; gap: 18px">
      <!-- 新增请假表单 -->
      <ElCard header="新增请假">
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
            <ElInput
              v-model="form.handover_to"
              placeholder="选填"
              clearable
            />
          </ElFormItem>

          <ElFormItem label="请假说明">
            <ElInput
              v-model="form.reason"
              type="textarea"
              :rows="3"
              placeholder="请填写请假原因"
            />
          </ElFormItem>

          <ElFormItem>
            <ElButton
              type="primary"
              :loading="submitting"
              @click="handleSubmit"
            >
              提交请假申请
            </ElButton>
          </ElFormItem>
        </ElForm>

        <div style="color: #64748b; font-size: 13px; line-height: 1.7">
          说明：半天请假仅支持单日申请；提交后会写入 leave_requests，审批状态默认是"待审批"。
        </div>
      </ElCard>

      <!-- 我的请假记录 -->
      <ElCard>
        <template #header>
          <div style="display: flex; justify-content: space-between; align-items: center">
            <h3 style="margin: 0">我的请假记录</h3>
            <div style="display: flex; gap: 10px">
              <ElButton size="small" @click="fetchData">刷新列表</ElButton>
              <ElButton
                size="small"
                @click="hideWithdrawnOrRejected = !hideWithdrawnOrRejected"
              >
                {{ hideWithdrawnOrRejected ? '显示全部' : '隐藏撤回/驳回' }}
              </ElButton>
            </div>
          </div>
        </template>

        <div v-if="filteredLeaveRequests.length === 0" style="padding: 20px; color: #64748b; text-align: center">
          暂无请假记录
        </div>

        <ElTable
          v-else
          ref="tableRef"
          :data="filteredLeaveRequests"
          row-key="id"
          border
          stripe
          highlight-current-row
          style="width: 100%"
          @row-click="handleRowClick"
        >
          <ElTableColumn type="expand" width="44">
            <template #default="{ row }">
              <div style="padding: 12px 24px; color: #334155; font-size: 14px; line-height: 1.8">
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px 24px">
                  <div>请假说明：{{ row.reason || '-' }}</div>
                  <div>工作交接人：{{ row.handover_to || '-' }}</div>
                  <div>当前审批人：{{ getApproverLabel(row as LeaveRequestApi.LeaveRequest) }}</div>
                  <div>最近处理：{{ getLatestActionDisplay(row as LeaveRequestApi.LeaveRequest) }}</div>
                  <div>请假天数覆盖：{{ (row.date_keys || []).length }} 天</div>
                  <div>创建时间：{{ row.created_at ? new Date(row.created_at).toLocaleString('zh-CN') : '-' }}</div>
                </div>
                <div v-if="row.approval_status === 'pending'" style="margin-top: 14px; padding-top: 12px; border-top: 1px solid #e2e8f0; display: flex; justify-content: flex-end; gap: 8px">
                  <ElButton size="small" @click="viewDetail(row.id)">查看详情</ElButton>
                  <ElButton size="small" type="danger" @click="handleWithdraw(row.id)">
                    撤回申请
                  </ElButton>
                </div>
              </div>
            </template>
          </ElTableColumn>

          <ElTableColumn label="日期范围" min-width="200">
            <template #default="{ row }">
              {{ row.start_date === row.end_date ? row.start_date : `${row.start_date} 至 ${row.end_date}` }}
            </template>
          </ElTableColumn>

          <ElTableColumn label="请假类型" width="120" align="center">
            <template #default="{ row }">
              <ElTag type="info">{{ leaveTypeOptions[row.leave_type] }}</ElTag>
            </template>
          </ElTableColumn>

          <ElTableColumn label="时段" width="100" align="center">
            <template #default="{ row }">
              <ElTag>{{ sessionOptions[row.session] }}</ElTag>
            </template>
          </ElTableColumn>

          <ElTableColumn label="状态" width="120" align="center">
            <template #default="{ row }">
              <ElTag :type="statusTagType(row.approval_status)">
                {{ statusOptions[row.approval_status] }}
              </ElTag>
            </template>
          </ElTableColumn>

          <ElTableColumn label="创建时间" width="180">
            <template #default="{ row }">
              {{ row.created_at ? new Date(row.created_at).toLocaleString('zh-CN') : '-' }}
            </template>
          </ElTableColumn>
        </ElTable>
      </ElCard>
    </div>

    <!-- 我的请假年历 -->
    <ElCard style="margin-top: 18px">
      <template #header>
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px">
          <div>
            <h3 style="margin: 0">我的请假年历</h3>
            <p style="margin: 8px 0 0; color: #64748b; font-size: 14px">
              按年查看自己的请假分布，直接看到每一天的请假类型和状态。
            </p>
          </div>
          <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap">
            <ElButton size="small" @click="changeYear(currentYear - 1)">上一年</ElButton>
            <span style="display: inline-flex; align-items: center; justify-content: center; min-width: 88px; padding: 10px 14px; border-radius: 10px; background: #e2e8f0; color: #0f172a; font-weight: 700">
              {{ currentYear }}
            </span>
            <ElButton size="small" @click="changeYear(currentYear + 1)">下一年</ElButton>
            <ElButton size="small" type="primary" @click="changeYear(new Date().getFullYear())">
              回到今年
            </ElButton>
          </div>
        </div>
      </template>

      <!-- 统计数据 -->
      <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; margin-bottom: 16px">
        <div style="padding: 14px 16px; border-radius: 14px; background: #f8fafc">
          <div style="color: #64748b; font-size: 13px">当年请假记录</div>
          <div style="margin-top: 8px; font-size: 22px; font-weight: 700">{{ stats.recordCount }}</div>
        </div>
        <div style="padding: 14px 16px; border-radius: 14px; background: #f8fafc">
          <div style="color: #64748b; font-size: 13px">当年覆盖天数</div>
          <div style="margin-top: 8px; font-size: 22px; font-weight: 700">{{ stats.dayCount }}</div>
        </div>
        <div style="padding: 14px 16px; border-radius: 14px; background: #f8fafc">
          <div style="color: #64748b; font-size: 13px">待审批记录</div>
          <div style="margin-top: 8px; font-size: 22px; font-weight: 700">{{ stats.pendingCount }}</div>
        </div>
        <div style="padding: 14px 16px; border-radius: 14px; background: #f8fafc">
          <div style="color: #64748b; font-size: 13px">当年年假总计</div>
          <div style="margin-top: 8px; font-size: 22px; font-weight: 700">{{ stats.annualEntitlement }}</div>
        </div>
        <div style="padding: 14px 16px; border-radius: 14px; background: #f8fafc">
          <div style="color: #64748b; font-size: 13px">当年年假可用</div>
          <div style="margin-top: 8px; font-size: 22px; font-weight: 700">{{ stats.annualAvailable }}</div>
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
      <div v-if="selectedDateKey" style="margin-top: 16px; padding: 16px; border-radius: 14px; background: #f8fafc">
        <h4 style="margin: 0 0 12px; font-size: 16px">{{ selectedDateKey }} · 日期详情</h4>
        <div v-if="!dayMap[selectedDateKey]?.length" style="color: #64748b">
          当天没有请假记录。
        </div>
        <div v-else style="display: flex; flex-direction: column; gap: 10px">
          <div
            v-for="item in dayMap[selectedDateKey]"
            :key="item.id"
            style="padding: 10px 0; border-top: 1px solid #e2e8f0; font-size: 14px; line-height: 1.7"
          >
            <div>类型：{{ leaveTypeOptions[item.leave_type] }}</div>
            <div>时段：{{ sessionOptions[item.session] }}</div>
            <div>状态：{{ statusOptions[item.approval_status] }}</div>
            <div>说明：{{ item.reason || '-' }}</div>
          </div>
        </div>
      </div>
    </ElCard>
  </Page>
</template>
