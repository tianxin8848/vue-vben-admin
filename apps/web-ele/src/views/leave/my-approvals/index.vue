<script lang="ts" setup>
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue';

import {
  ElButton,
  ElCard,
  ElDialog,
  ElInput,
  ElMessage,
  ElSelect,
  ElTable,
  ElTableColumn,
  ElTag,
} from 'element-plus';

import {
  getMyApprovalRecordsApi,
  getMyPendingApprovalsApi,
  getSystemSettingsApi,
  getUserInfoApi,
  reviewLeaveRequestApi,
} from '#/api';

const loading = ref(false);

const currentTime = ref('');
let timer: null | number = null;

const userInfo = ref<null | {
  department: null | string;
  full_name: string;
  username: string;
}>(null);

const pendingItems = ref<any[]>([]);
const processedItems = ref<any[]>([]);

const searchForm = reactive({
  keyword: '',
  region: '',
  department: '',
});

const regions = ref<string[]>([]);
const departments = ref<string[]>([]);

const showReviewModal = ref(false);
const reviewComment = ref('');
const currentRequestId = ref('');
const currentRequest = ref<any>(null);
const allowAction = ref(false);

const leaveTypeLabelMap: Record<string, string> = {
  annual: '年假',
  personal: '事假',
  sick: '病假',
  lieu: '调休',
  long: '长假',
};

const leaveSessionLabelMap: Record<string, string> = {
  full_day: '全天',
  morning: '上午',
  afternoon: '下午',
};

const actionLabelMap: Record<string, string> = {
  approved: '已通过',
  rejected: '已驳回',
  withdrawn: '已撤回',
  pending: '待审批',
};

const statusTypeMap: Record<string, 'danger' | 'info' | 'success' | 'warning'> =
  {
    pending: 'warning',
    approved: 'success',
    rejected: 'danger',
    withdrawn: 'info',
  };

const filteredPendingItems = computed(() => {
  const keyword = searchForm.keyword.trim().toLowerCase();
  const region = searchForm.region;
  const department = searchForm.department;

  return pendingItems.value.filter((item) => {
    if (region && (item.employee_region || '') !== region) return false;
    if (department && (item.employee_department || '') !== department)
      return false;
    if (!keyword) return true;

    const target = [
      item.employee_code || '',
      item.employee_username || '',
      item.employee_name || '',
      item.employee_department || '',
      item.employee_region || '',
    ]
      .join(' ')
      .toLowerCase();
    return target.includes(keyword);
  });
});

const filteredProcessedItems = computed(() => {
  const keyword = searchForm.keyword.trim().toLowerCase();
  const region = searchForm.region;
  const department = searchForm.department;

  return processedItems.value.filter((item) => {
    if (region && (item.employee_region || '') !== region) return false;
    if (department && (item.employee_department || '') !== department)
      return false;
    if (!keyword) return true;

    const target = [
      item.employee_code || '',
      item.employee_username || '',
      item.employee_name || '',
      item.employee_department || '',
      item.employee_region || '',
      item.comment || '',
    ]
      .join(' ')
      .toLowerCase();
    return target.includes(keyword);
  });
});

function formatNow() {
  const now = new Date();
  const weekLabels = [
    '星期日',
    '星期一',
    '星期二',
    '星期三',
    '星期四',
    '星期五',
    '星期六',
  ];
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

function formatLeaveType(type: string) {
  return leaveTypeLabelMap[type] || type;
}

function formatSession(session: string) {
  return leaveSessionLabelMap[session] || session;
}

function formatAction(action: string) {
  return actionLabelMap[action] || action;
}

function buildChainTags(chain: any[], currentApproverId: string) {
  if (!chain || chain.length === 0) {
    return [{ name: '未配置', isCurrent: true }];
  }
  return chain.map((node) => ({
    name: node.username || node.full_name || node.user_id,
    isCurrent: node.user_id === currentApproverId,
  }));
}

async function fetchData() {
  loading.value = true;
  try {
    await Promise.all([
      loadPendingApprovals(),
      loadApprovalRecords(),
      loadUserInfo(),
      loadSystemSettings(),
    ]);
  } catch (error) {
    console.error('Fetch data error:', error);
  } finally {
    loading.value = false;
  }
}

async function loadPendingApprovals() {
  try {
    pendingItems.value = await getMyPendingApprovalsApi();
  } catch {
    pendingItems.value = [];
  }
}

async function loadApprovalRecords() {
  try {
    processedItems.value = await getMyApprovalRecordsApi();
  } catch {
    processedItems.value = [];
  }
}

async function loadUserInfo() {
  try {
    const user = await getUserInfoApi();
    userInfo.value = {
      username: user.username,
      full_name: user.realName,
      department: user.department || null,
    };
  } catch {
    userInfo.value = null;
  }
}

async function loadSystemSettings() {
  try {
    const settings = await getSystemSettingsApi();
    regions.value = settings.regions || [];
    departments.value = settings.departments || [];
  } catch {
    regions.value = [];
    departments.value = [];
  }
}

function openModal(id: string, canAction: boolean) {
  const item = pendingItems.value.find((i) => i.id === id);
  if (!item) return;

  currentRequestId.value = id;
  currentRequest.value = item;
  reviewComment.value = '';
  allowAction.value = canAction;
  showReviewModal.value = true;
}

function closeModal() {
  showReviewModal.value = false;
  currentRequestId.value = '';
  currentRequest.value = null;
}

async function submitDecision(action: 'approved' | 'rejected') {
  if (!currentRequestId.value) return;

  const comment = reviewComment.value.trim() || null;
  if (action === 'rejected' && !comment) {
    ElMessage.warning('驳回必须填写原因');
    return;
  }

  try {
    await reviewLeaveRequestApi(currentRequestId.value, {
      approval_status: action,
      review_comment: comment,
    });
    ElMessage.success(action === 'approved' ? '已通过' : '已驳回');
    closeModal();
    await loadPendingApprovals();
    await loadApprovalRecords();
  } catch {
    ElMessage.error('提交失败');
  }
}

onMounted(() => {
  startLiveClock();
  fetchData();
});

onUnmounted(() => {
  if (timer) clearInterval(timer);
});
</script>

<template>
  <div class="my-approvals-page" v-loading="loading">
    <div class="page-header">
      <div class="header-info">
        <h2>我的待办（请假）</h2>
        <p class="page-subtitle">
          无需管理员身份，只要在审批链条里，就能在这里处理自己的审批任务。
        </p>
        <div class="live-time">{{ currentTime }}</div>
      </div>
      <div class="header-actions">
        <ElButton @click="fetchData">刷新</ElButton>
      </div>
    </div>

    <ElCard class="card">
      <template #header>
        <h3>待审批列表</h3>
      </template>

      <div class="filters">
        <ElInput
          v-model="searchForm.keyword"
          placeholder="搜索：姓名 / 账号 / 工号 / 部门 / 地区"
          clearable
        />
        <ElSelect v-model="searchForm.region" placeholder="全部地区" clearable>
          <ElOption v-for="r in regions" :key="r" :label="r" :value="r" />
        </ElSelect>
        <ElSelect
          v-model="searchForm.department"
          placeholder="全部部门"
          clearable
        >
          <ElOption v-for="d in departments" :key="d" :label="d" :value="d" />
        </ElSelect>
      </div>

      <div class="summary">
        待办 {{ pendingItems.length }} 条，当前筛选
        {{ filteredPendingItems.length }} 条
      </div>

      <div class="table-wrapper">
        <ElTable
          v-if="filteredPendingItems.length > 0"
          :data="filteredPendingItems"
          border
        >
          <ElTableColumn label="申请人" min-width="160">
            <template #default="{ row }">
              <div class="applicant-info">
                <strong>{{ row.employee_name }}</strong>
                <div class="applicant-meta">
                  {{ row.employee_username }} / {{ row.employee_code || '-' }}
                </div>
              </div>
            </template>
          </ElTableColumn>
          <ElTableColumn label="请假范围" min-width="180">
            <template #default="{ row }">
              <div>{{ row.start_date }} ~ {{ row.end_date }}</div>
              <div v-if="row.date_keys" class="date-count">
                覆盖 {{ row.date_keys.length }} 天
              </div>
            </template>
          </ElTableColumn>
          <ElTableColumn label="类型/时段" min-width="140">
            <template #default="{ row }">
              <div class="type-badges">
                <ElTag>{{ formatLeaveType(row.leave_type) }}</ElTag>
                <ElTag>{{ formatSession(row.session) }}</ElTag>
              </div>
              <div v-if="row.reason" class="leave-reason">{{ row.reason }}</div>
            </template>
          </ElTableColumn>
          <ElTableColumn label="部门/地区" min-width="140">
            <template #default="{ row }">
              {{ row.employee_department || '-' }} /
              {{ row.employee_region || '-' }}
            </template>
          </ElTableColumn>
          <ElTableColumn label="审批链" min-width="160">
            <template #default="{ row }">
              <ElTag
                v-for="(node, index) in buildChainTags(
                  row.approval_chain,
                  row.current_approver_id,
                )"
                :key="index"
                :type="node.isCurrent ? 'warning' : undefined"
                class="chain-tag"
              >
                {{ node.name }}
              </ElTag>
            </template>
          </ElTableColumn>
          <ElTableColumn label="操作" width="140">
            <template #default="{ row }">
              <div class="action-group">
                <ElButton
                  size="small"
                  type="primary"
                  @click="openModal(row.id, true)"
                >
                  审批
                </ElButton>
                <ElButton size="small" @click="openModal(row.id, false)">
                  查看
                </ElButton>
              </div>
            </template>
          </ElTableColumn>
        </ElTable>
        <div v-else class="empty">暂无待审批请假</div>
      </div>
    </ElCard>

    <ElCard class="card" style="margin-top: 16px">
      <template #header>
        <h3>我的已处理记录</h3>
      </template>

      <div class="summary">
        已处理 {{ processedItems.length }} 条，当前筛选
        {{ filteredProcessedItems.length }} 条
      </div>

      <div class="table-wrapper">
        <ElTable
          v-if="filteredProcessedItems.length > 0"
          :data="filteredProcessedItems"
          border
        >
          <ElTableColumn label="申请人" min-width="160">
            <template #default="{ row }">
              <div class="applicant-info">
                <strong>{{ row.employee_name }}</strong>
                <div class="applicant-meta">
                  {{ row.employee_username }} / {{ row.employee_code || '-' }}
                </div>
              </div>
            </template>
          </ElTableColumn>
          <ElTableColumn prop="start_date" label="请假范围" min-width="180">
            <template #default="{ row }">
              {{ row.start_date }} ~ {{ row.end_date }}
            </template>
          </ElTableColumn>
          <ElTableColumn label="处理结果" width="100">
            <template #default="{ row }">
              <ElTag :type="row.action === 'approved' ? 'success' : 'danger'">
                {{ formatAction(row.action) }}
              </ElTag>
            </template>
          </ElTableColumn>
          <ElTableColumn label="当前状态" width="100">
            <template #default="{ row }">
              <ElTag :type="statusTypeMap[row.approval_status_after] || 'info'">
                {{ formatAction(row.approval_status_after) }}
              </ElTag>
            </template>
          </ElTableColumn>
          <ElTableColumn
            prop="comment"
            label="处理备注"
            min-width="200"
            show-overflow-tooltip
          />
          <ElTableColumn prop="created_at" label="处理时间" width="150">
            <template #default="{ row }">
              {{
                row.created_at
                  ? new Date(row.created_at).toLocaleString('zh-CN')
                  : '-'
              }}
            </template>
          </ElTableColumn>
        </ElTable>
        <div v-else class="empty">暂无已处理记录</div>
      </div>
    </ElCard>

    <ElDialog
      v-model="showReviewModal"
      :title="allowAction ? '请假审批' : '请假详情'"
      width="600px"
    >
      <div v-if="currentRequest" class="modal-body">
        <div class="modal-subtitle">
          当前账号：{{ userInfo?.full_name || userInfo?.username || '-' }}
        </div>

        <div class="modal-section">
          <div class="section-title">申请信息</div>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">申请人：</span>
              <strong>{{ currentRequest.employee_name }}</strong>（{{ currentRequest.employee_username }}）
            </div>
            <div class="info-item">
              <span class="info-label">部门/地区：</span>
              {{ currentRequest.employee_department || '-' }} /
              {{ currentRequest.employee_region || '-' }}
            </div>
            <div class="info-item">
              <span class="info-label">范围：</span>
              {{ currentRequest.start_date }} ~
              {{ currentRequest.end_date }}（{{
                formatSession(currentRequest.session)
              }}）
            </div>
            <div class="info-item">
              <span class="info-label">类型：</span>
              {{ formatLeaveType(currentRequest.leave_type) }}
            </div>
            <div class="info-item">
              <span class="info-label">原因：</span>
              {{ currentRequest.reason || '无' }}
            </div>
          </div>
        </div>

        <div v-if="allowAction" class="modal-section">
          <div class="section-title">审批备注</div>
          <ElInput
            v-model="reviewComment"
            type="textarea"
            :rows="4"
            placeholder="通过可不填；驳回必须填写原因"
          />
        </div>
      </div>

      <template #footer>
        <ElButton @click="closeModal">关闭</ElButton>
        <template v-if="allowAction">
          <ElButton type="danger" @click="submitDecision('rejected')">
            驳回
          </ElButton>
          <ElButton type="primary" @click="submitDecision('approved')">
            通过
          </ElButton>
        </template>
      </template>
    </ElDialog>
  </div>
</template>

<style scoped>
.my-approvals-page {
  min-height: calc(100vh - 80px);
  padding: 32px;
  background: #f8fafc;
}

.page-header {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 24px;
}

.header-info h2 {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
}

.page-subtitle {
  margin: 8px 0 0;
  font-size: 14px;
  color: #64748b;
}

.live-time {
  margin-top: 10px;
  font-size: 14px;
  font-weight: 700;
  color: #2563eb;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.card {
  border-radius: 16px;
  box-shadow: 0 8px 24px rgb(15 23 42 / 8%);
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

.filters {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  margin-bottom: 16px;
}

.filters :deep(.el-input),
.filters :deep(.el-select) {
  min-width: 200px;
}

.summary {
  margin-bottom: 12px;
  font-size: 14px;
  color: #64748b;
}

.table-wrapper {
  overflow-x: auto;
}

.applicant-info {
  line-height: 1.6;
}

.applicant-meta {
  margin-top: 4px;
  font-size: 13px;
  color: #64748b;
}

.date-count {
  margin-top: 4px;
  font-size: 13px;
  color: #64748b;
}

.type-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 4px;
}

.leave-reason {
  font-size: 13px;
  line-height: 1.5;
  color: #64748b;
}

.chain-tag {
  margin: 2px 4px 2px 0;
}

.action-group {
  display: flex;
  gap: 8px;
}

.empty {
  padding: 24px;
  color: #64748b;
  text-align: center;
  background: #f8fafc;
  border-radius: 14px;
}

.modal-subtitle {
  margin-bottom: 16px;
  font-size: 13px;
  color: #64748b;
}

.modal-section {
  margin-bottom: 16px;
}

.section-title {
  margin-bottom: 10px;
  font-size: 13px;
  font-weight: 700;
  color: #334155;
}

.info-grid {
  padding: 12px 14px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
}

.info-item {
  margin-top: 8px;
  font-size: 14px;
  line-height: 1.6;
}

.info-item:first-child {
  margin-top: 0;
}

.info-label {
  color: #64748b;
}

@media (max-width: 980px) {
  .page-header {
    flex-direction: column;
  }

  .header-actions {
    justify-content: flex-start;
  }
}
</style>
