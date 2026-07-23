<script lang="ts" setup>
import { computed, onMounted, reactive, ref } from 'vue';

import {
  ElButton,
  ElCard,
  ElDialog,
  ElForm,
  ElFormItem,
  ElInput,
  ElInputNumber,
  ElMessage,
  ElOption,
  ElSelect,
  ElTable,
  ElTableColumn,
  ElTag,
  ElUpload,
} from 'element-plus';

import {
  createClaimApi,
  getClaimOptionsApi,
  getMyClaimHistoryApi,
  getMyClaimsApi,
  getMyClaimApprovalRecordsApi,
  getMyPendingClaimApprovalsApi,
  getUserInfoApi,
  reviewClaimApi,
} from '#/api';
import type { ClaimApi } from '#/api';

const loading = ref(false);

const userInfo = ref<null | {
  full_name: string;
  username: string;
}>(null);

// ─── 选项数据 ────────────────────────────────────────────────────────────────
const reasonOptions = ref<ClaimApi.ClaimReasonOption[]>([]);
const currencyOptions = ref<ClaimApi.ClaimCurrencyOption[]>([]);

// ─── Tab 状态 ────────────────────────────────────────────────────────────────
type TabKey = 'my' | 'history' | 'pending' | 'records';
const activeTab = ref<TabKey>('my');

// ─── 数据列表 ────────────────────────────────────────────────────────────────
const myClaims = ref<ClaimApi.ClaimResponse[]>([]);
const myHistory = ref<ClaimApi.ClaimResponse[]>([]);
const pendingApprovals = ref<ClaimApi.ClaimResponse[]>([]);
const approvalRecords = ref<ClaimApi.ClaimApprovalRecord[]>([]);

// ─── 新建表单 ────────────────────────────────────────────────────────────────
const showCreateModal = ref(false);
const createForm = reactive({
  reason_code: '',
  description: '',
  amount: 0,
  currency: 'HKD',
  attachmentFile: null as null | File,
});
const submitting = ref(false);

// ─── 审批弹窗 ────────────────────────────────────────────────────────────────
const showReviewModal = ref(false);
const currentReviewItem = ref<ClaimApi.ClaimResponse | null>(null);
const reviewComment = ref('');

// ─── 状态映射 ────────────────────────────────────────────────────────────────
const statusLabelMap: Record<string, string> = {
  approved: '已通过',
  pending: '审批中',
  rejected: '已驳回',
  withdrawn: '已撤回',
};

const statusTypeMap: Record<string, '' | 'danger' | 'info' | 'success' | 'warning'> = {
  approved: 'success',
  pending: 'warning',
  rejected: 'danger',
  withdrawn: 'info',
};

const actionLabelMap: Record<string, string> = {
  approved: '通过',
  created: '提交',
  rejected: '驳回',
  withdrawn: '撤回',
};

// ─── 计算属性 ────────────────────────────────────────────────────────────────
const selectedCurrencyRate = computed(() => {
  const found = currencyOptions.value.find(
    (c) => c.currency_code === createForm.currency,
  );
  return found?.to_hkd_rate ?? 1;
});

const estimatedHkd = computed(() => {
  return Math.round(createForm.amount * selectedCurrencyRate.value * 100) / 100;
});

// ─── 数据加载 ────────────────────────────────────────────────────────────────
async function fetchAll() {
  loading.value = true;
  try {
    await Promise.all([
      loadOptions(),
      loadUserInfo(),
      loadMyClaims(),
      loadMyHistory(),
      loadPendingApprovals(),
      loadApprovalRecords(),
    ]);
  } catch (e) {
    console.error('Fetch all error:', e);
  } finally {
    loading.value = false;
  }
}

async function loadOptions() {
    try {
      const opts = await getClaimOptionsApi();
      reasonOptions.value = (opts as any).claim_reasons || [];
      currencyOptions.value = (opts as any).claim_currencies || [];
    } catch {
      reasonOptions.value = [];
      currencyOptions.value = [];
    }
  }

async function loadUserInfo() {
  try {
    const user = await getUserInfoApi();
    userInfo.value = { username: user.username, full_name: user.realName };
  } catch {
    userInfo.value = null;
  }
}

async function loadMyClaims() {
  try {
    myClaims.value = await getMyClaimsApi();
  } catch {
    myClaims.value = [];
  }
}

async function loadMyHistory() {
  try {
    myHistory.value = await getMyClaimHistoryApi();
  } catch {
    myHistory.value = [];
  }
}

async function loadPendingApprovals() {
  try {
    pendingApprovals.value = await getMyPendingClaimApprovalsApi();
  } catch {
    pendingApprovals.value = [];
  }
}

async function loadApprovalRecords() {
  try {
    approvalRecords.value = await getMyClaimApprovalRecordsApi();
  } catch {
    approvalRecords.value = [];
  }
}

// ─── 新建报销 ────────────────────────────────────────────────────────────────
function openCreateModal() {
  createForm.reason_code = '';
  createForm.description = '';
  createForm.amount = 0;
  createForm.currency = currencyOptions.value[0]?.currency_code || 'HKD';
  createForm.attachmentFile = null;
  showCreateModal.value = true;
}

function handleFileChange(uploadFile: any) {
  createForm.attachmentFile = uploadFile.raw || null;
}

async function submitCreate() {
  if (!createForm.reason_code) {
    ElMessage.warning('请选择报销理由');
    return;
  }
  if (createForm.amount <= 0) {
    ElMessage.warning('金额必须大于 0');
    return;
  }
  if (!createForm.attachmentFile) {
    ElMessage.warning('请上传附件');
    return;
  }

  submitting.value = true;
  try {
    const fd = new FormData();
    fd.append('reason_code', createForm.reason_code);
    fd.append('amount', String(createForm.amount));
    fd.append('currency', createForm.currency);
    if (createForm.description) {
      fd.append('description', createForm.description);
    }
    fd.append('attachment', createForm.attachmentFile);
    await createClaimApi(fd);
    ElMessage.success('报销申请已提交');
    showCreateModal.value = false;
    await loadMyClaims();
  } catch {
    ElMessage.error('提交失败');
  } finally {
    submitting.value = false;
  }
}

// ─── 审批操作 ────────────────────────────────────────────────────────────────
function openReviewModal(item: ClaimApi.ClaimResponse) {
  currentReviewItem.value = item;
  reviewComment.value = '';
  showReviewModal.value = true;
}

async function submitReview(action: 'approved' | 'rejected') {
  if (!currentReviewItem.value) return;
  if (action === 'rejected' && !reviewComment.value.trim()) {
    ElMessage.warning('驳回必须填写原因');
    return;
  }
  try {
    await reviewClaimApi(currentReviewItem.value.id, {
      approval_status: action,
      review_comment: reviewComment.value.trim() || null,
    });
    ElMessage.success(action === 'approved' ? '已通过' : '已驳回');
    showReviewModal.value = false;
    await loadPendingApprovals();
    await loadApprovalRecords();
  } catch {
    ElMessage.error('操作失败');
  }
}

function formatStatus(status: string) {
  return statusLabelMap[status] || status;
}

function formatAction(action: string) {
  return actionLabelMap[action] || action;
}

function formatDate(dt: null | string) {
  if (!dt) return '-';
  return dt.replace('T', ' ').slice(0, 16);
}

onMounted(() => {
  fetchAll();
});
</script>

<template>
  <div class="claims-page">
    <!-- 页头 -->
    <div class="page-header">
      <div class="header-info">
        <h2>报销管理</h2>
        <p class="page-subtitle">
          提交报销申请、查看审批进度与历史记录
          <template v-if="userInfo">
            &nbsp;·&nbsp;当前用户：{{ userInfo.full_name }}（{{ userInfo.username }}）
          </template>
        </p>
      </div>
      <div class="header-actions">
        <ElButton type="primary" @click="openCreateModal">
          新建报销申请
        </ElButton>
      </div>
    </div>

    <!-- Tab 切换 -->
    <div class="tab-bar">
      <button
        :class="['tab-btn', { active: activeTab === 'my' }]"
        @click="activeTab = 'my'"
      >
        我的报销
        <ElTag v-if="myClaims.length" size="small" type="warning" class="tab-badge">
          {{ myClaims.length }}
        </ElTag>
      </button>
      <button
        :class="['tab-btn', { active: activeTab === 'history' }]"
        @click="activeTab = 'history'"
      >
        历史记录
      </button>
      <button
        :class="['tab-btn', { active: activeTab === 'pending' }]"
        @click="activeTab = 'pending'"
      >
        待我审批
        <ElTag v-if="pendingApprovals.length" size="small" type="danger" class="tab-badge">
          {{ pendingApprovals.length }}
        </ElTag>
      </button>
      <button
        :class="['tab-btn', { active: activeTab === 'records' }]"
        @click="activeTab = 'records'"
      >
        审批记录
      </button>
    </div>

    <!-- 我的报销 -->
    <ElCard v-if="activeTab === 'my'" class="card" :class="{ loading }">
      <ElTable
        v-if="myClaims.length"
        :data="myClaims"
        border
        style="width: 100%"
      >
        <ElTableColumn label="报销理由" min-width="140">
          <template #default="{ row }">
            <strong>{{ row.reason_label }}</strong>
          </template>
        </ElTableColumn>
        <ElTableColumn label="金额" min-width="130">
          <template #default="{ row }">
            <span class="amount">{{ row.amount.toFixed(2) }} {{ row.currency }}</span>
            <div v-if="row.amount_hkd" class="amount-hkd">
              ≈ HKD {{ row.amount_hkd.toFixed(2) }}
            </div>
          </template>
        </ElTableColumn>
        <ElTableColumn label="说明" min-width="160" prop="description">
          <template #default="{ row }">
            {{ row.description || '-' }}
          </template>
        </ElTableColumn>
        <ElTableColumn label="状态" width="100">
          <template #default="{ row }">
            <ElTag :type="statusTypeMap[row.approval_status] || 'info'">
              {{ formatStatus(row.approval_status) }}
            </ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn label="提交时间" width="160">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </ElTableColumn>
        <ElTableColumn label="附件" width="100">
          <template #default="{ row }">
            <a
              v-if="row.attachment_url"
              :href="row.attachment_url"
              target="_blank"
              class="link"
            >
              {{ row.attachment_name || '查看' }}
            </a>
            <span v-else>-</span>
          </template>
        </ElTableColumn>
      </ElTable>
      <div v-else class="empty-tip">暂无进行中的报销申请</div>
    </ElCard>

    <!-- 历史记录 -->
    <ElCard v-if="activeTab === 'history'" class="card">
      <ElTable
        v-if="myHistory.length"
        :data="myHistory"
        border
        style="width: 100%"
      >
        <ElTableColumn label="报销理由" min-width="140">
          <template #default="{ row }">
            <strong>{{ row.reason_label }}</strong>
          </template>
        </ElTableColumn>
        <ElTableColumn label="金额" min-width="130">
          <template #default="{ row }">
            <span class="amount">{{ row.amount.toFixed(2) }} {{ row.currency }}</span>
            <div v-if="row.amount_hkd" class="amount-hkd">
              ≈ HKD {{ row.amount_hkd.toFixed(2) }}
            </div>
          </template>
        </ElTableColumn>
        <ElTableColumn label="说明" min-width="160" prop="description">
          <template #default="{ row }">
            {{ row.description || '-' }}
          </template>
        </ElTableColumn>
        <ElTableColumn label="最终状态" width="100">
          <template #default="{ row }">
            <ElTag :type="statusTypeMap[row.approval_status] || 'info'">
              {{ formatStatus(row.approval_status) }}
            </ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn label="审批意见" min-width="140" prop="review_comment">
          <template #default="{ row }">
            {{ row.review_comment || '-' }}
          </template>
        </ElTableColumn>
        <ElTableColumn label="提交时间" width="160">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </ElTableColumn>
      </ElTable>
      <div v-else class="empty-tip">暂无历史记录</div>
    </ElCard>

    <!-- 待我审批 -->
    <ElCard v-if="activeTab === 'pending'" class="card">
      <ElTable
        v-if="pendingApprovals.length"
        :data="pendingApprovals"
        border
        style="width: 100%"
      >
        <ElTableColumn label="申请人" min-width="150">
          <template #default="{ row }">
            <div>
              <strong>{{ row.employee_name }}</strong>
              <div class="meta-text">{{ row.employee_username }}</div>
            </div>
          </template>
        </ElTableColumn>
        <ElTableColumn label="报销理由" min-width="130">
          <template #default="{ row }">
            {{ row.reason_label }}
          </template>
        </ElTableColumn>
        <ElTableColumn label="金额" min-width="130">
          <template #default="{ row }">
            <span class="amount">{{ row.amount.toFixed(2) }} {{ row.currency }}</span>
            <div v-if="row.amount_hkd" class="amount-hkd">
              ≈ HKD {{ row.amount_hkd.toFixed(2) }}
            </div>
          </template>
        </ElTableColumn>
        <ElTableColumn label="说明" min-width="160" prop="description">
          <template #default="{ row }">
            {{ row.description || '-' }}
          </template>
        </ElTableColumn>
        <ElTableColumn label="提交时间" width="160">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </ElTableColumn>
        <ElTableColumn label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <ElButton size="small" type="primary" @click="openReviewModal(row as ClaimApi.ClaimResponse)">
              审批
            </ElButton>
          </template>
        </ElTableColumn>
      </ElTable>
      <div v-else class="empty-tip">暂无待审批报销</div>
    </ElCard>

    <!-- 审批记录 -->
    <ElCard v-if="activeTab === 'records'" class="card">
      <ElTable
        v-if="approvalRecords.length"
        :data="approvalRecords"
        border
        style="width: 100%"
      >
        <ElTableColumn label="申请人" min-width="150">
          <template #default="{ row }">
            <div>
              <strong>{{ row.employee_name }}</strong>
              <div class="meta-text">{{ row.employee_username }}</div>
            </div>
          </template>
        </ElTableColumn>
        <ElTableColumn label="报销理由" min-width="130">
          <template #default="{ row }">
            {{ row.claim_reason_label }}
          </template>
        </ElTableColumn>
        <ElTableColumn label="金额" min-width="120">
          <template #default="{ row }">
            <span class="amount">{{ row.amount.toFixed(2) }} {{ row.currency }}</span>
          </template>
        </ElTableColumn>
        <ElTableColumn label="操作" width="90">
          <template #default="{ row }">
            <ElTag :type="row.action === 'approved' ? 'success' : row.action === 'rejected' ? 'danger' : 'info'">
              {{ formatAction(row.action) }}
            </ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn label="备注" min-width="140" prop="comment">
          <template #default="{ row }">
            {{ row.comment || '-' }}
          </template>
        </ElTableColumn>
        <ElTableColumn label="时间" width="160">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </ElTableColumn>
      </ElTable>
      <div v-else class="empty-tip">暂无审批记录</div>
    </ElCard>

    <!-- 新建报销弹窗 -->
    <ElDialog
      v-model="showCreateModal"
      title="新建报销申请"
      width="560px"
      :close-on-click-modal="false"
    >
      <ElForm label-width="90px" class="create-form">
        <ElFormItem label="报销理由" required>
          <ElSelect
            v-model="createForm.reason_code"
            placeholder="请选择"
            style="width: 100%"
          >
            <ElOption
              v-for="r in reasonOptions"
              :key="r.name"
              :label="r.name"
              :value="r.name"
            />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="金额" required>
          <ElInputNumber
            v-model="createForm.amount"
            :min="0.01"
            :precision="2"
            :step="100"
            style="width: 200px"
          />
          <ElSelect
            v-model="createForm.currency"
            style="width: 120px; margin-left: 12px"
          >
            <ElOption
              v-for="c in currencyOptions"
              :key="c.currency_code"
              :label="c.currency_code"
              :value="c.currency_code"
            />
          </ElSelect>
        </ElFormItem>
        <ElFormItem v-if="createForm.currency !== 'HKD'" label="折合港币">
          <span class="hkd-preview">≈ HKD {{ estimatedHkd.toFixed(2) }}</span>
        </ElFormItem>
        <ElFormItem label="说明">
          <ElInput
            v-model="createForm.description"
            type="textarea"
            :rows="3"
            placeholder="可选，补充说明报销用途"
          />
        </ElFormItem>
        <ElFormItem label="附件" required>
          <ElUpload
            :auto-upload="false"
            :limit="1"
            accept="image/*,.pdf"
            @change="handleFileChange"
          >
            <ElButton>选择文件</ElButton>
            <template #tip>
              <div class="upload-tip">支持图片或 PDF，用于报销凭证</div>
            </template>
          </ElUpload>
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="showCreateModal = false">取消</ElButton>
        <ElButton type="primary" :loading="submitting" @click="submitCreate">
          提交申请
        </ElButton>
      </template>
    </ElDialog>

    <!-- 审批弹窗 -->
    <ElDialog
      v-model="showReviewModal"
      title="审批报销申请"
      width="560px"
      :close-on-click-modal="false"
    >
      <div v-if="currentReviewItem" class="review-detail">
        <div class="detail-row">
          <span class="detail-label">申请人：</span>
          <strong>{{ currentReviewItem.employee_name }}</strong>
          （{{ currentReviewItem.employee_username }}）
        </div>
        <div class="detail-row">
          <span class="detail-label">部门/地区：</span>
          {{ currentReviewItem.employee_department || '-' }}
          /
          {{ currentReviewItem.employee_region || '-' }}
        </div>
        <div class="detail-row">
          <span class="detail-label">报销理由：</span>
          {{ currentReviewItem.reason_label }}
        </div>
        <div class="detail-row">
          <span class="detail-label">金额：</span>
          <span class="amount">
            {{ currentReviewItem.amount.toFixed(2) }}
            {{ currentReviewItem.currency }}
          </span>
          <span v-if="currentReviewItem.amount_hkd" class="amount-hkd">
            &nbsp;≈ HKD {{ currentReviewItem.amount_hkd.toFixed(2) }}
          </span>
        </div>
        <div class="detail-row">
          <span class="detail-label">说明：</span>
          {{ currentReviewItem.description || '无' }}
        </div>
        <div class="detail-row">
          <span class="detail-label">附件：</span>
          <a
            v-if="currentReviewItem.attachment_url"
            :href="currentReviewItem.attachment_url"
            target="_blank"
            class="link"
          >
            {{ currentReviewItem.attachment_name || '查看附件' }}
          </a>
          <span v-else>无</span>
        </div>
        <div class="review-comment-section">
          <div class="detail-label">审批备注：</div>
          <ElInput
            v-model="reviewComment"
            type="textarea"
            :rows="3"
            placeholder="通过可不填；驳回必须填写原因"
          />
        </div>
      </div>
      <template #footer>
        <ElButton @click="showReviewModal = false">取消</ElButton>
        <ElButton type="danger" @click="submitReview('rejected')">驳回</ElButton>
        <ElButton type="primary" @click="submitReview('approved')">通过</ElButton>
      </template>
    </ElDialog>
  </div>
</template>

<style scoped>
.claims-page {
  padding: 32px;
  background: #f8fafc;
  min-height: calc(100vh - 80px);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 24px;
}

.header-info h2 {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
}

.page-subtitle {
  margin: 8px 0 0;
  color: #64748b;
  font-size: 14px;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.tab-bar {
  display: flex;
  gap: 4px;
  margin-bottom: 20px;
  border-bottom: 2px solid #e2e8f0;
  padding-bottom: 0;
}

.tab-btn {
  position: relative;
  padding: 10px 20px;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  color: #64748b;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: color 0.15s, border-color 0.15s;
}

.tab-btn:hover {
  color: #1e40af;
}

.tab-btn.active {
  color: #1e40af;
  border-bottom-color: #1e40af;
}

.tab-badge {
  margin-left: 2px;
}

.card {
  border-radius: 16px;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08);
}

.card.loading {
  opacity: 0.6;
}

.empty-tip {
  padding: 40px 0;
  text-align: center;
  color: #94a3b8;
  font-size: 14px;
}

.amount {
  font-weight: 600;
  color: #1e293b;
}

.amount-hkd {
  font-size: 12px;
  color: #64748b;
  margin-top: 2px;
}

.meta-text {
  font-size: 12px;
  color: #64748b;
  margin-top: 2px;
}

.link {
  color: #2563eb;
  text-decoration: none;
}

.link:hover {
  text-decoration: underline;
}

.create-form {
  padding: 8px 0;
}

.hkd-preview {
  font-weight: 600;
  color: #1e40af;
}

.upload-tip {
  font-size: 12px;
  color: #94a3b8;
  margin-top: 4px;
}

.review-detail .detail-row {
  margin-bottom: 12px;
  font-size: 14px;
  line-height: 1.6;
}

.detail-label {
  color: #64748b;
  font-size: 13px;
}

.review-comment-section {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #e2e8f0;
}
</style>
